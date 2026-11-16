#!/usr/bin/env bash
# Checks Rumbo 2's image (deploy/Dockerfile.v2, design.md «Risks»): it runs as `node`, it does not carry the fake Access
# of the e2e tests (e2e/servidor-prueba.mjs), and started against PostgreSQL it refuses that fake token with 401 and is
# not healthy until the migration is done. Runs in the `servidor` job of the CI after the image builds.
# Usage: PG*=… pruebas/imagen-v2.sh [image]
#   DOCKER_RED   how the container reaches PostgreSQL and is reached (default: --network host, as in the CI)
#   PUERTO       where the container answers (default 8080); PGHOST_IMAGEN overrides PGHOST inside the container
set -Eeuo pipefail
imagen=${1:-rumbo-v2:ci}
red=${DOCKER_RED:---network host}
puerto=${PUERTO:-8080}
raiz=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
token=$(sed -n "s/^export const TOKEN = '\(.*\)';$/\1/p" "$raiz/e2e/servidor-prueba.mjs")
[[ -n $token ]] || { echo "No encontré el token de mentira en e2e/servidor-prueba.mjs" >&2; exit 1; }
falla() { echo "FALLA: $*" >&2; exit 1; }

echo "· Corre sin root"
[[ $(docker image inspect -f '{{.Config.User}}' "$imagen") == node ]] || falla "la imagen no usa el usuario node"
[[ $(docker run --rm --entrypoint id "$imagen" -u) != 0 ]] || falla "corre como root"

echo "· No lleva el Access de mentira"
docker run --rm --entrypoint sh "$imagen" -c '
  test ! -e /app/e2e || { echo "está /app/e2e"; exit 1; }
  test -z "$(find / -xdev -name "servidor-prueba*" 2>/dev/null)" || { echo "está servidor-prueba"; exit 1; }
  ! grep -rqsF "$1" /app || { echo "el token de mentira está en /app"; exit 1; }
  ! grep -rqsF "servidor-prueba" /app/servidor /app/paquetes /app/app || { echo "algo nombra servidor-prueba"; exit 1; }
' sh "$token" || falla "la imagen tiene el Access de mentira"

echo "· Con el token de mentira responde 401 y sin migración no está sana"
nombre=rumbo-v2-prueba-$$
# shellcheck disable=SC2086  # $red holds docker options
docker run -d --rm --name "$nombre" $red -e PORT="$puerto" \
  -e PGHOST="${PGHOST_IMAGEN:-$PGHOST}" -e PGPORT="${PGPORT:-5432}" -e PGUSER -e PGPASSWORD -e PGDATABASE \
  -e ACCESS_TEAM=prueba -e ACCESS_AUD=aud-de-prueba -e CORREOS_PERMITIDOS=e2e@rumbo.test "$imagen" > /dev/null
trap 'docker logs "$nombre" 2>&1 | tail -20; docker rm -f "$nombre" > /dev/null 2>&1 || true' EXIT
url=http://127.0.0.1:$puerto
for _ in $(seq 1 30); do curl -fs -o /dev/null "$url/" && break; sleep 1; done
estado() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
[[ $(estado "$url/") == 200 ]] || falla "la página no responde"
[[ $(estado -H "Cf-Access-Jwt-Assertion: $token" "$url/api/v2/datos") == 401 ]] || falla "el token de mentira no da 401"
[[ $(estado -X PUT -H "Cf-Access-Jwt-Assertion: $token" -H 'Content-Type: application/json' -d '{"main":null,"cols":{}}' \
  "$url/api/v2/datos") == 401 ]] || falla "el token de mentira no da 401 al escribir"
[[ $(estado "$url/api/v2/datos") == 401 ]] || falla "sin token no da 401"
[[ $(estado "$url/api/datos") == 401 ]] || falla "la ruta de la v1 no pide sesión"
salud=$(curl -s "$url/salud")
[[ $salud == '{"error":"sin-migracion"}' ]] || falla "/salud sin migración dio $salud"
echo "La imagen de Rumbo 2 pasa"
