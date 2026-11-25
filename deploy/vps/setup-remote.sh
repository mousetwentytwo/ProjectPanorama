#!/usr/bin/env bash
# Runs ON the VPS as root (via deploy/setup.sh). $1 = folder holding nginx/. Idempotent.
set -euo pipefail
SRC="$1"
HOST=leapgames.twentytwosoftware.com
LPORT=10486
DIR="${DEPLOY_DIR:-/var/www/leapgames}"
OWNER="${DEPLOY_OWNER:-root}"
STATE=/var/lib/leapgames-deploy          # sha256 of what this script last installed, per file
CF=/etc/cloudflared/config.yml
TS=$(date -u +%Y%m%d-%H%M%S)
mkdir -p "$STATE"
BACKUPS=()

log() { echo "[setup] $*"; }
sha() { sha256sum "$1" | cut -d' ' -f1; }

# install_managed <src> <dest>: never overwrites a file someone edited by hand (unless FORCE=1).
install_managed() {
  local src=$1 dest=$2 key; key="$STATE/$(echo "$dest" | tr / _).sha256"
  if [ ! -e "$dest" ]; then
    install -m 644 "$src" "$dest"; sha "$dest" >"$key"; log "installed $dest"; return
  fi
  if cmp -s "$src" "$dest"; then rm -f "$dest.new"; sha "$dest" >"$key"; log "unchanged $dest"; return; fi
  if [ -f "$key" ] && [ "$(sha "$dest")" = "$(cat "$key")" ] || [ "${FORCE:-0}" = 1 ]; then
    cp -p "$dest" "$dest.bak-$TS"; BACKUPS+=("$dest")
    rm -f "$dest.new"; install -m 644 "$src" "$dest"; sha "$dest" >"$key"; log "updated $dest (backup .bak-$TS)"
  else
    install -m 644 "$src" "$dest.new"
    log "KEPT hand-edited $dest; new version written to $dest.new (diff it, merge, or re-run with FORCE=1)"
  fi
}

restore() { for f in "${BACKUPS[@]}"; do mv -f "$f.bak-$TS" "$f"; log "restored $f"; done; }

command -v nginx >/dev/null || { apt-get update -qq && apt-get install -y -qq nginx; }

# Port must be free or already ours (nginx).
if ss -ltnpH "sport = :$LPORT" | grep -v nginx | grep -q .; then
  log "port $LPORT is used by something else:"; ss -ltnp "sport = :$LPORT"; exit 1
fi

mkdir -p "$DIR/releases"; chown "$OWNER" "$DIR" "$DIR/releases"
mkdir -p /etc/nginx/snippets /etc/nginx/sites-available /etc/nginx/sites-enabled
install_managed "$SRC/nginx/leapgames-headers.conf" /etc/nginx/snippets/leapgames-headers.conf
install_managed "$SRC/nginx/leapgames-tunnel.conf"  /etc/nginx/sites-available/leapgames-tunnel.conf
[ -e /etc/nginx/sites-enabled/leapgames-tunnel.conf ] || {
  ln -s /etc/nginx/sites-available/leapgames-tunnel.conf /etc/nginx/sites-enabled/; log "enabled site"; }

if ! nginx -t 2>/dev/null; then nginx -t || true; restore; log "nginx -t failed, changes reverted"; exit 1; fi
systemctl reload nginx 2>/dev/null || systemctl start nginx
log "nginx ok"

# Tunnel ingress: only add, never rewrite existing entries.
if [ -f "$CF" ]; then
  if grep -q "hostname: *$HOST" "$CF"; then
    log "tunnel ingress for $HOST already present (left as is)"
  elif grep -q "service: *http_status:404" "$CF"; then
    cp -p "$CF" "$CF.bak-$TS"
    awk -v h="$HOST" -v p="$LPORT" '
      !done && /^[[:space:]]*-[[:space:]]*service:[[:space:]]*http_status:404/ {
        match($0, /^[[:space:]]*/); ind = substr($0, 1, RLENGTH)
        print ind "- hostname: " h; print ind "  service: http://localhost:" p; done = 1 }
      { print }' "$CF.bak-$TS" >"$CF"
    if command -v cloudflared >/dev/null && ! cloudflared tunnel ingress validate --config "$CF" >/dev/null 2>&1; then
      mv -f "$CF.bak-$TS" "$CF"; log "ingress validate failed, $CF restored"; exit 1
    fi
    systemctl restart cloudflared; log "added $HOST to $CF (backup .bak-$TS), cloudflared restarted"
    TID=$(awk '/^tunnel:/{print $2}' "$CF")
    log "DNS once, if not yet routed: cloudflared tunnel route dns ${TID:-<tunnel-id>} $HOST"
  else
    log "no http_status:404 catch-all in $CF; add the ingress by hand: hostname $HOST -> http://localhost:$LPORT"
  fi
else
  log "no $CF (token/dashboard tunnel): add Public Hostname $HOST -> HTTP localhost:$LPORT in Zero Trust"
fi

curl -fsS -o /dev/null -H "Host: $HOST" "http://127.0.0.1:$LPORT/" 2>/dev/null \
  && log "origin answers on 127.0.0.1:$LPORT" \
  || log "origin not serving yet (expected before the first deploy)"
