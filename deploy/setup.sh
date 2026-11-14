#!/usr/bin/env bash
# Prepares the Akhana VPS for Rumbo (docs/DESPLIEGUE.md, «Puesta en marcha»). Run by Joaquín as root, step by step:
#   setup.sh llave      creates the read-only deploy key and prints the public half for GitHub
#   setup.sh base       folders, the `apps` network, the clone, the .env files and the systemd units (not enabled)
#   setup.sh activar    enables the timers once the .env files, rclone and the first deploy are done
# It never touches /opt/akhana, Akhana's units, ufw or the Docker daemon (restarting Docker would cut Akhana).
set -Eeuo pipefail

REPO=git@github-rumbo:JoaquinVM/rumbo.git
APPS=/opt/apps
RUMBO=$APPS/rumbo
KEY=/root/.ssh/rumbo_deploy
UNITS=(rumbo-deploy.service rumbo-deploy.timer rumbo-backup.service rumbo-backup.timer
    rumbo-restore-check.service rumbo-restore-check.timer)

[[ $(id -u) == 0 ]] || { echo "Correr como root" >&2; exit 1; }
step=${1:-}

case $step in
    llave)
        if [[ ! -f $KEY ]]; then
            ssh-keygen -q -t ed25519 -N '' -C "vps-akhana-rumbo-deploy" -f "$KEY"
        fi
        if ! grep -q '^Host github-rumbo$' /root/.ssh/config 2> /dev/null; then
            printf '\nHost github-rumbo\n  HostName github.com\n  User git\n  IdentityFile %s\n  IdentitiesOnly yes\n' "$KEY" >> /root/.ssh/config
            chmod 600 /root/.ssh/config
        fi
        echo "Agregar esta llave en GitHub > JoaquinVM/rumbo > Settings > Deploy keys, sin permiso de escritura:"
        cat "$KEY.pub"
        ;;
    base)
        install -d -m 755 "$APPS" "$RUMBO"
        install -d -m 700 "$RUMBO/state" "$APPS/tunel" /var/backups/apps /var/backups/apps/rumbo
        if ! docker network inspect apps > /dev/null 2>&1; then
            docker network create --driver bridge --opt com.docker.network.bridge.name=br-apps apps
        fi
        if [[ ! -d $RUMBO/app/.git ]]; then
            git clone --quiet "$REPO" "$RUMBO/app"
        fi
        git -C "$RUMBO/app" fetch --quiet origin
        [[ -f $RUMBO/.env ]] || install -m 600 "$RUMBO/app/deploy/.env.example" "$RUMBO/.env"
        [[ -f $APPS/tunel/.env ]] || install -m 600 "$RUMBO/app/deploy/tunel/.env.example" "$APPS/tunel/.env"
        for unit in "${UNITS[@]}"; do
            install -m 644 "$RUMBO/app/deploy/systemd/$unit" "/etc/systemd/system/$unit"
        done
        systemctl daemon-reload
        echo "Listo. Falta: completar $RUMBO/.env y $APPS/tunel/.env, configurar rclone en $APPS/rclone.conf"
        echo "(docs/DESPLIEGUE.md), levantar el túnel y el primer despliegue, y después: setup.sh activar"
        ;;
    activar)
        systemctl enable --now rumbo-deploy.timer rumbo-backup.timer rumbo-restore-check.timer
        systemctl list-timers 'rumbo-*' --no-pager
        ;;
    *)
        echo "Uso: setup.sh llave | base | activar" >&2
        exit 2
        ;;
esac
