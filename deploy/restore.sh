#!/usr/bin/env bash
# Restores Rumbo's database (PUB-03, docs/DESPLIEGUE.md).
# Usage:
#   restore.sh --check <latest|file>    restores into a scratch database next to the real one, counts what came back
#                                       and drops it; the real data is never touched. rumbo-restore-check.timer runs
#                                       it every week with `latest` (the newest backup in B2) and reports.
#   restore.sh --replace <file> --yes   replaces the real data with that backup: stops the server, takes a pre-restore
#                                       backup, restores, starts again. Only by hand.
set -Eeuo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

mode="" source_file="" yes=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --check) mode=check; source_file=$2; shift 2 ;;
        --replace) mode=replace; source_file=$2; shift 2 ;;
        --yes) yes=true; shift ;;
        *) echo "Opción desconocida: $1" >&2; exit 2 ;;
    esac
done
[[ -n $mode && -n $source_file ]] || { echo "Uso: restore.sh --check <latest|archivo> | --replace <archivo> --yes" >&2; exit 2; }

run_log=$(mktemp)
work=$(mktemp -d)
trap 'rm -rf "$run_log" "$work"' EXIT
exec > >(tee -a "$run_log") 2>&1

alert() {
    [[ $mode == check ]] && ping_check "${HEALTHCHECK_RESTORE_URL:-}" "$@"
    return 0
}
# shellcheck disable=SC2317,SC2329  # called from the ERR trap
on_error() {
    log "ERROR: la restauración falló (línea $1)"
    compose exec -T db dropdb -U rumbo --if-exists rumbo_prueba > /dev/null 2>&1 || true
    alert fail "$(tail -c 9000 "$run_log")"
    exit 1
}
trap 'on_error $LINENO' ERR

alert start
if [[ $source_file == latest ]]; then
    newest=$($RCLONE lsf --max-depth 1 --include '/rumbo-*.dump' "$BACKUP_REMOTE" | sort | tail -n 1)
    [[ -n $newest ]] || { log "No hay respaldos en $BACKUP_REMOTE"; false; }
    log "Bajando $newest de $BACKUP_REMOTE"
    $RCLONE copy "$BACKUP_REMOTE$newest" "$work"
    source_file=$work/$newest
fi
[[ -r $source_file ]] || { log "No se puede leer $source_file"; false; }
log "Verificando $(basename "$source_file") ($(du -h "$source_file" | cut -f1))"
compose exec -T db pg_restore --list < "$source_file" > /dev/null

count() {
    compose exec -T db psql -U rumbo -d "$1" -qAt -c \
        "SELECT (SELECT count(*) FROM principal) || ' personas con ajustes, ' || (SELECT count(*) FROM docs) || ' documentos'"
}

if [[ $mode == check ]]; then
    compose exec -T db dropdb -U rumbo --if-exists rumbo_prueba
    compose exec -T db createdb -U rumbo rumbo_prueba
    compose exec -T db pg_restore -U rumbo -d rumbo_prueba --no-owner --exit-on-error < "$source_file"
    restored=$(count rumbo_prueba)
    compose exec -T db dropdb -U rumbo rumbo_prueba
    log "La restauración de prueba trajo $restored (la base real tiene $(count rumbo))"
    alert "" "$(tail -c 9000 "$run_log")"
    exit 0
fi

$yes || { log "Para reemplazar los datos reales hay que agregar --yes"; exit 2; }
log "Deteniendo el servidor de Rumbo"
compose stop app
"$DEPLOY_DIR/backup.sh" --tag pre-restore --local-only
log "Reemplazando la base con $(basename "$source_file")"
compose exec -T db pg_restore -U rumbo -d rumbo --no-owner --clean --if-exists --single-transaction --exit-on-error < "$source_file"
log "Quedó: $(count rumbo)"
compose start app
log "Restauración terminada"
