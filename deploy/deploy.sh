#!/usr/bin/env bash
# Upload the static site to the VPS as a new release, then switch the `current` symlink.
# No build step: ships index.html and src/ as-is. Needs only ssh and tar locally (Git Bash works).
# nginx serves /var/www/leapgames/current. Content only: never touches nginx/cloudflared config
# (that is deploy/setup.sh, which keeps hand edits on the VPS).
#
#   DEPLOY_HOST=user@vps.example.com ./deploy/deploy.sh
#
# Env: DEPLOY_HOST (required, user@host), DEPLOY_DIR (default /var/www/leapgames),
#      DEPLOY_SSH_PORT (default 22), DEPLOY_KEEP (releases to keep, default 3)
set -euo pipefail

cd "$(dirname "$0")/.."
: "${DEPLOY_HOST:?set DEPLOY_HOST=user@host}"
DIR="${DEPLOY_DIR:-/var/www/leapgames}"
PORT="${DEPLOY_SSH_PORT:-22}"
KEEP="${DEPLOY_KEEP:-3}"
FILES=(index.html src)

for f in "${FILES[@]}"; do test -e "$f" || { echo "missing $f" >&2; exit 1; }; done

REL="$(date -u +%Y%m%d-%H%M%S)"
echo "[deploy] uploading release $REL to $DEPLOY_HOST:$DIR"
tar -czf - "${FILES[@]}" | ssh -p "$PORT" "$DEPLOY_HOST" "
  set -e
  mkdir -p '$DIR/releases/$REL'
  tar -xzf - -C '$DIR/releases/$REL'
  ln -sfn '$DIR/releases/$REL' '$DIR/current.tmp' && mv -Tf '$DIR/current.tmp' '$DIR/current'
  cd '$DIR/releases' && ls -1 | sort | head -n -$KEEP | xargs -r rm -rf
"
echo "[deploy] done: $DIR/current -> releases/$REL (nginx needs no reload)"
