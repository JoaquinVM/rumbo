#!/usr/bin/env bash
# Deploys a tested version of Rumbo (PUB-05, docs/DESPLIEGUE.md): checkout, build, backup, start, wait until healthy.
# Tests run in CI before a tag reaches the production branch, not here.
# Usage: deploy.sh [--ref <production|tag|commit>] [--no-pull]
#   --ref      what to deploy; by default the production branch (moved by CI to the last tested tag)
#   --no-pull  deploys the current checkout as is (rehearsal on the Mac)
# If the build or the start fails, it goes back to the previous version on its own. The schema only grows
# (servidor/esquema.sql), so going back never needs a restore; the pre-deploy backup stays in BACKUP_DIR anyway.
# Only touches the compose project `rumbo`: never Docker itself, never Akhana.
set -Eeuo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

ref=production
pull=true
while [[ $# -gt 0 ]]; do
    case $1 in
        --ref) ref=$2; shift 2 ;;
        --no-pull) pull=false; shift ;;
        *) echo "Opción desconocida: $1" >&2; exit 2 ;;
    esac
done

repo_dir=$(cd "$DEPLOY_DIR/.." && pwd)
state_dir=$RUMBO_DIR/state
image=rumbo-app
mkdir -p "$state_dir"

if command -v flock > /dev/null; then
    exec 9> "$state_dir/deploy.lock"
    flock -n 9 || { log "ERROR: ya hay un despliegue en curso"; exit 1; }
fi

git_() {
    git -C "$repo_dir" "$@"
}

wait_healthy() {
    local status=missing
    log "Esperando a que Rumbo esté sano (hasta 2 minutos)"
    for _ in $(seq 1 24); do
        status=$(app_health)
        [[ $status == healthy ]] && return 0
        sleep 5
    done
    log "Rumbo no quedó sano (estado: $status). Últimas líneas del log:"
    compose logs --tail 80 app
    return 1
}

# shellcheck disable=SC2317,SC2329  # called from the ERR trap
rollback() {
    trap - ERR
    set +e
    log "ERROR (línea $1): no se despliega ${target:0:7}; volviendo a ${previous:0:7}"
    echo "failed $target" > "$state_dir/last-result"
    if ! $has_rollback_image; then
        log "No hay imagen anterior (primer despliegue): revisar a mano"
        exit 1
    fi
    docker tag "$image:rollback" "$image"
    git_ checkout --quiet --detach "$previous"
    if ! $started; then
        log "Falló antes de tocar los servicios: sigue atendiendo $(git_ log -1 --format='%h %s')"
        exit 1
    fi
    if compose up -d --no-build --remove-orphans && wait_healthy; then
        log "Quedó la versión anterior: $(git_ log -1 --format='%h %s')"
    else
        log "ERROR: la versión anterior tampoco quedó sana; revisar a mano (docs/DESPLIEGUE.md, «Volver atrás»)"
    fi
    exit 1
}

previous=$(cat "$state_dir/deployed" 2> /dev/null || git_ rev-parse HEAD)
if $pull; then
    log "Bajando $ref"
    git_ fetch --quiet --force --tags origin '+refs/heads/*:refs/remotes/origin/*'
    target=$(git_ rev-parse --verify --quiet "origin/$ref^{commit}" || git_ rev-parse --verify "$ref^{commit}")
    git_ checkout --quiet --detach "$target"
fi
target=$(git_ rev-parse HEAD)
log "Versión: $(git_ describe --tags --always) · $(git_ log -1 --format='%h %s') (antes: ${previous:0:7})"

has_rollback_image=false
if docker image inspect "$image" > /dev/null 2>&1; then
    docker tag "$image" "$image:rollback"
    has_rollback_image=true
fi
started=false
trap 'rollback $LINENO' ERR

log "Construyendo la imagen (la versión actual sigue atendiendo)"
compose build --pull app

if [[ -n $(compose ps --status running --quiet db 2> /dev/null) ]]; then
    "$DEPLOY_DIR/backup.sh" --tag pre-deploy --local-only
else
    log "La base todavía no está corriendo: primer despliegue, sin respaldo previo"
fi

log "Levantando los servicios"
started=true
compose up -d --remove-orphans
wait_healthy

trap - ERR
echo "$target" > "$state_dir/deployed"
echo "ok $target" > "$state_dir/last-result"
docker image prune -f --filter label=jviscafe.app=rumbo > /dev/null
compose ps
log "Despliegue listo"
