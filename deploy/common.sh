# shellcheck shell=bash
# Shared settings of Rumbo's deploy scripts (docs/DESPLIEGUE.md). Sourced, not run. They follow the pattern of
# Akhana's deploy/ but share nothing with it: other folder, other compose project, other rclone config.
# Every path can be overridden from the environment (rehearsal on the Mac).

RUMBO_DIR=${RUMBO_DIR:-/opt/apps/rumbo}
ENV_FILE=${ENV_FILE:-$RUMBO_DIR/.env}
DEPLOY_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
COMPOSE_PROJECT=${COMPOSE_PROJECT:-rumbo}

if [[ ! -r $ENV_FILE ]]; then
    echo "No se puede leer $ENV_FILE (copiar deploy/.env.example y completarlo)" >&2
    exit 1
fi
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

BACKUP_DIR=${BACKUP_DIR:-/var/backups/apps/rumbo}
BACKUP_KEEP_LOCAL_DAYS=${BACKUP_KEEP_LOCAL_DAYS:-7}
BACKUP_KEEP_REMOTE_DAYS=${BACKUP_KEEP_REMOTE_DAYS:-60}
RCLONE_CONFIG=${RCLONE_CONFIG:-/opt/apps/rclone.conf}
export RCLONE_CONFIG
RCLONE=${RCLONE:-rclone}

compose() {
    docker compose -p "$COMPOSE_PROJECT" -f "$DEPLOY_DIR/docker-compose.yml" --env-file "$ENV_FILE" "$@"
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Pings healthchecks.io: ping_check <url> [start|fail] [message]. An empty URL means no alerts.
ping_check() {
    local url=$1 suffix=${2:-} body=${3:-}
    [[ -z $url ]] && return 0
    curl -fsS -m 10 --retry 3 --data-raw "$body" "$url${suffix:+/$suffix}" > /dev/null || log "Aviso: no se pudo avisar a healthchecks.io"
}

# Health of the server container: healthy, unhealthy, starting or missing
app_health() {
    local id
    id=$(compose ps --quiet app 2> /dev/null)
    [[ -z $id ]] && { echo missing; return; }
    docker inspect --format '{{.State.Health.Status}}' "$id" 2> /dev/null || echo missing
}
