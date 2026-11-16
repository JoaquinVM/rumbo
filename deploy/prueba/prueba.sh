#!/usr/bin/env bash
# Rumbo 2's test environment on the Akhana VPS (PUB-07, docs/DESPLIEGUE.md «Ambiente de prueba»). Run by Joaquín as
# root, one step at a time:
#   prueba.sh revisar      only reads: free memory, the limits of the apps' containers and that rumbo.jviscafe.com is up
#   prueba.sh base         the .env and the database `rumbo2_prueba` with its own role, in Rumbo's Postgres
#   prueba.sh levantar     builds this branch's image and starts the container (unhealthy until `cargar`)
#   prueba.sh cargar       a fresh local backup of Rumbo, its v1 tables restored into rumbo2_prueba, migrated to
#                          cents for the emails in CORREOS_PERMITIDOS only; prints counts, never amounts
#   prueba.sh actualizar   after a fix on the branch: pulls it and starts the new image (keeps the data)
#   prueba.sh apagar       at the cut (job 080): stops it and deletes its database, its role and its folder
# It never touches /opt/akhana, Rumbo's database `rumbo`, its container or its .env, and never restarts Docker.
set -Eeuo pipefail

DIR=/opt/apps/rumbo-prueba
APP=$DIR/app
ENV_FILE=$DIR/.env
RUMBO=/opt/apps/rumbo
DB=rumbo-db-1
BASE=rumbo2_prueba # not rumbo_prueba: restore.sh --check creates and drops that one every Sunday
COMPOSE=(docker compose -p rumbo-prueba -f "$APP/deploy/prueba/docker-compose.yml" --env-file "$ENV_FILE")

[[ $(id -u) == 0 ]] || { echo "Correr como root" >&2; exit 1; }
log() { echo "[$(date '+%H:%M:%S')] $*"; }
# SQL as arguments (-c) or, with sql_rumbo, from stdin (so the password never shows in a process list)
psql_rumbo() { docker exec "$DB" psql -U rumbo -d postgres -v ON_ERROR_STOP=1 -qAt "$@" < /dev/null; }
sql_rumbo() { docker exec -i "$DB" psql -U rumbo -d postgres -v ON_ERROR_STOP=1 -qAt; }
rama() { git -C "$APP" rev-parse --abbrev-ref HEAD; }

case ${1:-} in
    revisar)
        awk '/^MemTotal:|^MemAvailable:/ {printf "  %-14s %6d MiB\n", $1, $2 / 1024}' /proc/meminfo
        echo "  Topes de los contenedores de las apps (red apps):"
        total=0
        for c in $(docker network inspect apps --format '{{range .Containers}}{{.Name}} {{end}}'); do
            m=$(docker inspect --format '{{.HostConfig.Memory}}' "$c"); total=$((total + m))
            printf "    %-28s %5d MiB\n" "$c" $((m / 1048576))
        done
        for c in $(docker ps --filter label=com.docker.compose.project=rumbo --format '{{.Names}}'); do
            docker network inspect apps --format '{{range .Containers}}{{.Name}} {{end}}' | grep -qw "$c" && continue
            m=$(docker inspect --format '{{.HostConfig.Memory}}' "$c"); total=$((total + m))
            printf "    %-28s %5d MiB\n" "$c" $((m / 1048576))
        done
        echo "  Suman $((total / 1048576)) MiB; el ambiente de prueba agrega 256 MiB"
        docker inspect --format '  rumbo.jviscafe.com: {{.Name}} {{.State.Health.Status}}, desde {{.State.StartedAt}}' rumbo-app-1 rumbo-db-1
        ;;
    base)
        install -d -m 700 "$DIR"
        if [[ ! -f $ENV_FILE ]]; then
            install -m 600 "$APP/deploy/prueba/.env.example" "$ENV_FILE"
            sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$(openssl rand -hex 24)/" "$ENV_FILE"
            team=$(sed -n 's/^ACCESS_TEAM=//p' "$RUMBO/.env")
            sed -i "s/^ACCESS_TEAM=.*/ACCESS_TEAM=$team/" "$ENV_FILE"
        fi
        pw=$(sed -n 's/^DB_PASSWORD=//p' "$ENV_FILE")
        if [[ -z $(psql_rumbo -c "SELECT 1 FROM pg_roles WHERE rolname = '$BASE'") ]]; then
            printf "CREATE ROLE %s LOGIN PASSWORD '%s';\n" "$BASE" "$pw" | sql_rumbo
            log "Rol $BASE creado"
        fi
        if [[ -z $(psql_rumbo -c "SELECT 1 FROM pg_database WHERE datname = '$BASE'") ]]; then
            psql_rumbo -c "CREATE DATABASE $BASE OWNER $BASE" -c "REVOKE ALL ON DATABASE $BASE FROM PUBLIC"
            log "Base $BASE creada"
        fi
        # The role cannot read Rumbo's data: the tables of `rumbo` belong to `rumbo` and grant nothing to others
        if docker exec "$DB" psql -U "$BASE" -d rumbo -qAt -c 'SELECT count(*) FROM docs' < /dev/null > /dev/null 2>&1; then
            echo "FALLA: el rol $BASE puede leer la base de Rumbo" >&2; exit 1
        fi
        log "Comprobado: $BASE no puede leer la base de Rumbo"
        echo "Falta completar en $ENV_FILE: ACCESS_AUD (de la aplicación de Access rumbo-prueba) y CORREOS_PERMITIDOS (tu correo)"
        ;;
    levantar|actualizar)
        if [[ $1 == actualizar ]]; then git -C "$APP" pull --quiet --ff-only; fi
        log "Construyendo la imagen de $(rama) ($(git -C "$APP" rev-parse --short HEAD))"
        "${COMPOSE[@]}" build --pull
        "${COMPOSE[@]}" up -d
        "${COMPOSE[@]}" ps
        ;;
    cargar)
        log "Respaldo local nuevo de Rumbo (solo lee su base)"
        "$RUMBO/app/deploy/backup.sh" --tag prueba --local-only
        archivo=$(ls -1t /var/backups/apps/rumbo/rumbo-*-prueba.dump | head -n 1)
        log "Restaurando las tablas de la v1 de $(basename "$archivo") en $BASE"
        docker exec -i "$DB" pg_restore -U "$BASE" -d "$BASE" --no-owner --no-privileges --clean --if-exists \
            --exit-on-error -t principal -t docs < "$archivo"
        log "Pasando a centavos y cargando la copia"
        "${COMPOSE[@]}" run --rm --no-deps -T prueba node migracion/dist/cargar-prueba.mjs
        "${COMPOSE[@]}" ps
        ;;
    apagar)
        "${COMPOSE[@]}" down --rmi local
        psql_rumbo -c "DROP DATABASE IF EXISTS $BASE" -c "DROP ROLE IF EXISTS $BASE"
        rm -rf "$DIR"
        log "Ambiente de prueba apagado y borrado"
        ;;
    *)
        echo "Uso: prueba.sh revisar | base | levantar | cargar | actualizar | apagar" >&2
        exit 2
        ;;
esac
