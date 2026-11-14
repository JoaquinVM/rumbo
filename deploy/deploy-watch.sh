#!/usr/bin/env bash
# Pull-based delivery and health (PUB-04, PUB-05, docs/DESPLIEGUE.md), run every 2 minutes by rumbo-deploy.timer.
# When CI moves the production branch to a new tested tag, deploys it once with deploy.sh; a version that fails is not
# retried (deploy.sh already went back to the previous one). Every run pings HEALTHCHECK_DEPLOY_URL: red while the
# last deploy failed, Rumbo is not healthy or the apps tunnel is not connected; green otherwise. No ping for a while
# means the VPS or the timer is down, and healthchecks.io alerts too.
set -Eeuo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

repo_dir=$(cd "$DEPLOY_DIR/.." && pwd)
state_dir=$RUMBO_DIR/state
seen_file=$state_dir/production-seen
result_file=$state_dir/last-result
mkdir -p "$state_dir"

# What is wrong right now, empty if nothing
problems() {
    local p=() health
    [[ $(cat "$result_file" 2> /dev/null) == failed* ]] && p+=("el último despliegue falló ($(cat "$result_file"))")
    health=$(app_health)
    if [[ $health != healthy ]]; then
        p+=("Rumbo no está sano (estado: $health)")
    elif ! compose exec -T app wget -qO /dev/null -T 5 http://tunel:2000/ready 2> /dev/null; then
        p+=("el túnel de las apps no está conectado a Cloudflare")
    fi
    (( ${#p[@]} )) && printf '%s\n' "${p[@]}"
    return 0
}

report() {
    local wrong
    wrong=$(problems)
    if [[ -n $wrong ]]; then
        log "Problemas: $wrong"
        ping_check "${HEALTHCHECK_DEPLOY_URL:-}" fail "$wrong"$'\n\n'"$1"
    else
        ping_check "${HEALTHCHECK_DEPLOY_URL:-}" "" "$1"
    fi
}

if ! heads=$(git -C "$repo_dir" ls-remote --heads origin production); then
    log "ERROR: no se pudo consultar GitHub"
    ping_check "${HEALTHCHECK_DEPLOY_URL:-}" fail "No se pudo consultar la rama production en GitHub"
    exit 1
fi
if [[ -z $heads ]]; then
    report "Todavía no hay rama production (se crea con el primer tag v* que pase CI)"
    exit 0
fi
target=${heads%%[[:space:]]*}

if [[ $target == "$(cat "$seen_file" 2> /dev/null)" ]]; then
    report "Sin cambios: production en ${target:0:7} ($(cat "$result_file" 2> /dev/null || echo 'sin despliegues'))"
    exit 0
fi
# Recorded before deploying: a failed version is tried once, not every 2 minutes
echo "$target" > "$seen_file"
log "Nueva versión en production: ${target:0:7}"

run_log=$(mktemp)
trap 'rm -f "$run_log"' EXIT
status=0
"$DEPLOY_DIR/deploy.sh" --ref "$target" 2>&1 | tee "$run_log" || status=$?
[[ $status -eq 0 ]] || echo "failed $target" > "$result_file"
report "$(tail -c 9000 "$run_log")"
exit "$status"
