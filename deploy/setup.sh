#!/usr/bin/env bash
# Idempotent one-time/repeatable VPS setup: nginx site + snippet, web root, tunnel ingress.
# Safe to re-run: files edited by hand on the VPS are kept (the new version lands next to them as *.new).
#
#   DEPLOY_HOST=root@vps ./deploy/setup.sh            # FORCE=1 overwrites hand edits (with backup)
#
# Env: DEPLOY_HOST (required), DEPLOY_SSH_PORT (22), DEPLOY_DIR (/var/www/leapgames), FORCE (0).
set -euo pipefail
cd "$(dirname "$0")"
: "${DEPLOY_HOST:?set DEPLOY_HOST=user@host}"
PORT="${DEPLOY_SSH_PORT:-22}"
DIR="${DEPLOY_DIR:-/var/www/leapgames}"
SUDO=sudo; case "$DEPLOY_HOST" in root@*) SUDO=;; esac
tar -czf - nginx vps | ssh -p "$PORT" "$DEPLOY_HOST" "
  set -e; T=\$(mktemp -d); trap 'rm -rf \$T' EXIT
  tar -xzf - -C \$T && find \$T -type f -exec sed -i 's/\r\$//' {} +
  $SUDO env DEPLOY_DIR='$DIR' DEPLOY_OWNER=\$(id -un) FORCE='${FORCE:-0}' bash \$T/vps/setup-remote.sh \$T
"
