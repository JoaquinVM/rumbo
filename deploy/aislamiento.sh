#!/usr/bin/env bash
# Checks that Rumbo is isolated from Akhana (PUB-02, docs/DESPLIEGUE.md). Run by Joaquín as root on the VPS, any
# time: it only reads, and probes from one throwaway curl container on the `apps` network; it changes nothing.
#   0. Control: from the apps network Rumbo does answer, so the probes below mean something.
#   1. From the apps network, Akhana's container names do not resolve and no Akhana container IP answers.
#   2. From the apps network, the host does not answer on Akhana's ports (8081 local entry, 443/80 tailscale serve,
#      5432, 8080) on any of its addresses.
#   3. Rumbo's containers and the apps tunnel run without root, without docker.sock, without capabilities, without
#      published ports and with memory and CPU limits that add up to 1 GiB or less.
#   4. Shows when Akhana's containers started and how many times they restarted, to compare before and after.
# Exit code 0 only if 0 to 3 pass.
set -uo pipefail

CURL_IMAGE=${CURL_IMAGE:-curlimages/curl:8.23.0}
AKHANA_PORTS=(80 8080 5432)
HOST_PORTS=(8081 443 80 5432 8080)
fails=0
ok() { echo "  ok    $*"; }
bad() { echo "  FALLA $*"; fails=$((fails + 1)); }
info() { echo "  info  $*"; }

docker network inspect apps > /dev/null 2>&1 || { echo "FALLA: no existe la red apps"; exit 1; }
gateway=$(docker network inspect apps --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}')
mapfile -t akhana < <(docker ps --filter label=com.docker.compose.project=akhana --format '{{.Names}}')
mapfile -t ours < <(docker ps --filter label=com.docker.compose.project=rumbo --format '{{.Names}}'
    docker ps --filter label=com.docker.compose.project=apps-tunel --format '{{.Names}}')

# What to probe: names that must not resolve, and host:port pairs that must not answer
names=("${akhana[@]}" db api web tunnel)
targets=()
for name in "${akhana[@]}"; do
    for ip in $(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' "$name"); do
        for port in "${AKHANA_PORTS[@]}"; do targets+=("$ip:$port:$name"); done
    done
done
addresses=("$gateway")
read -r -a more <<< "$(hostname -I 2> /dev/null)"; addresses+=("${more[@]}")
command -v tailscale > /dev/null && addresses+=("$(tailscale ip -4 2> /dev/null | head -n 1)")
for ip in "${addresses[@]}"; do
    [[ -z $ip || $ip == *:* ]] && continue
    for port in "${HOST_PORTS[@]}" 22; do targets+=("$ip:$port:servidor"); done
done

# One container runs every probe and prints RESOLVE/NORESOLVE <name> and OPEN/CLOSED <ip:port:label>.
# curl over telnet:// exits 7 (refused) or 28 (timeout) when nothing answers.
script='curl -fsS -m 5 -o /dev/null http://rumbo:8080/salud && echo CONTROL-OK || echo CONTROL-FALLA
for n in '"${names[*]}"'; do getent hosts "$n" > /dev/null && echo "RESOLVE $n" || echo "NORESOLVE $n"; done
for t in '"${targets[*]}"'; do ip=${t%%:*}; rest=${t#*:}; port=${rest%%:*}
  curl -s -o /dev/null --connect-timeout 3 -m 4 "telnet://$ip:$port" < /dev/null; c=$?
  if [ $c -eq 7 ] || [ $c -eq 28 ]; then echo "CLOSED $t"; else echo "OPEN $t"; fi; done'
results=$(docker run --rm --network apps --user 65534:65534 --cap-drop ALL --security-opt no-new-privileges:true \
    --memory 64m --entrypoint sh "$CURL_IMAGE" -c "$script" 2>&1)

echo "0. Control"
grep -q CONTROL-OK <<< "$results" && ok "desde la red apps sí se llega a Rumbo" ||
    bad "desde la red apps no se llega a Rumbo: las pruebas de abajo no dirían nada"

echo "1. Contenedores de Akhana desde la red apps"
(( ${#akhana[@]} )) || info "no se encontraron contenedores del proyecto akhana"
while read -r what t; do
    case $what in
        RESOLVE) bad "el nombre $t se resuelve" ;;
        NORESOLVE) ok "el nombre $t no se resuelve" ;;
        OPEN|CLOSED)
            label=${t##*:}; hp=${t%:*}; port=${hp##*:}
            if [[ $label == servidor && $port == 22 ]]; then
                [[ $what == OPEN ]] && info "$hp (SSH del servidor) responde; no es de Akhana y pide llave"
            elif [[ $what == OPEN ]]; then bad "$label $hp responde"
            else ok "$label $hp no responde"; fi ;;
    esac
done < <(grep -E '^(RESOLVE|NORESOLVE|OPEN|CLOSED) ' <<< "$results" | sort -s -k2,2)
grep -qE '^(RESOLVE|NORESOLVE|OPEN|CLOSED) ' <<< "$results" || { bad "la sonda no corrió:"; echo "$results"; }

echo "3. Contenedores de Rumbo y del túnel"
(( ${#ours[@]} )) || bad "no hay contenedores de Rumbo ni del túnel corriendo"
total=0
for name in "${ours[@]}"; do
    read -r user mem cpus caps nnp ports < <(docker inspect --format \
        '{{if .Config.User}}{{.Config.User}}{{else}}root{{end}} {{.HostConfig.Memory}} {{.HostConfig.NanoCpus}} {{join .HostConfig.CapDrop ","}}. {{join .HostConfig.SecurityOpt ","}}. {{len .HostConfig.PortBindings}}' "$name")
    if [[ $user == root || $user == 0 || $user == 0:* ]]; then bad "$name corre como root"; else ok "$name corre como $user"; fi
    if docker inspect --format '{{range .Mounts}}{{.Source}} {{end}}' "$name" | grep -q docker.sock; then bad "$name tiene docker.sock"; else ok "$name no tiene docker.sock"; fi
    if [[ $caps == *ALL* ]]; then ok "$name sin capacidades de Linux"; else bad "$name conserva capacidades de Linux"; fi
    if [[ $nnp == *no-new-privileges* ]]; then ok "$name con no-new-privileges"; else bad "$name sin no-new-privileges"; fi
    if [[ $ports == 0 ]]; then ok "$name no publica puertos"; else bad "$name publica puertos"; fi
    if (( mem > 0 && cpus > 0 )); then ok "$name con tope de $((mem / 1048576)) MiB y $((cpus / 10000000)) % de una CPU"
    else bad "$name sin tope de memoria o CPU"; fi
    total=$((total + mem))
done
if (( total > 0 && total <= 1073741824 )); then ok "los topes suman $((total / 1048576)) MiB (máximo 1024)"
else bad "los topes suman $((total / 1048576)) MiB"; fi

echo "4. Akhana (comparar antes y después)"
for name in "${akhana[@]}"; do
    info "$(docker inspect --format '{{.Name}} desde {{.State.StartedAt}}, {{.RestartCount}} reinicios' "$name")"
done

echo
if (( fails )); then echo "Aislamiento: $fails fallas"; exit 1; fi
echo "Aislamiento: todo bien"
