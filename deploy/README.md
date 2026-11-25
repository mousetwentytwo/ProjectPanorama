# Deploy to the shared VPS (leapgames.twentytwosoftware.com)

Same box and pattern as Bias Codex (`biascodex.twentytwosoftware.com`): `cloudflared` is already running,
nginx listens on loopback, the tunnel maps the hostname to it. Leap Games has no build: plain files.

```
visitor -> Cloudflare (TLS) -> tunnel -> cloudflared -> nginx 127.0.0.1:10486 -> /var/www/leapgames/current -> releases/<ts>
                                                      \-> nginx 127.0.0.1:10480 -> Bias Codex (unchanged)
```

## VPS setup (repeatable)

```bash
DEPLOY_HOST=root@<vps> ./deploy/setup.sh
```

Runs `deploy/vps/setup-remote.sh` on the VPS as root. Every step is idempotent, so re-run it after changing
anything in `deploy/nginx/`:

| Step | Behaviour |
|---|---|
| nginx | installed if missing |
| port 10486 | aborts if something other than nginx listens there |
| `/var/www/leapgames/releases` | created, owned by the ssh user |
| `snippets/leapgames-headers.conf`, `sites-available/leapgames-tunnel.conf` | missing: installed. Unchanged since the last setup: updated (`.bak-<ts>` kept). **Edited by hand on the VPS: kept**, repo version written to `<file>.new` with a warning. `FORCE=1` overwrites (with backup). |
| `sites-enabled` symlink | created only if missing |
| `nginx -t` | on failure the backups are restored and setup stops; otherwise reload |
| `/etc/cloudflared/config.yml` | ingress for `leapgames.twentytwosoftware.com` added above the `http_status:404` catch-all **only if absent** (backup, `cloudflared tunnel ingress validate`, restart). Existing entries, Bias Codex included, are never rewritten. |

The script remembers what it installed as checksums in `/var/lib/leapgames-deploy/`, which is how it tells a hand edit from an old version.

Still manual, once:
- DNS for a locally managed tunnel: `cloudflared tunnel route dns <tunnel-id> leapgames.twentytwosoftware.com` (setup prints the tunnel id).
- Dashboard/token tunnel (no `config.yml`): Zero Trust -> Networks -> Tunnels -> Public Hostname `leapgames.twentytwosoftware.com` -> `HTTP localhost:10486` (this also creates DNS).

## Every deploy (from your machine)

```bash
DEPLOY_HOST=root@<vps> ./deploy/deploy.sh
```

Tars `index.html src`,
uploads a new release and switches `/var/www/leapgames/current`. No nginx reload, and nothing outside `/var/www/leapgames` is touched; last 3 releases kept.
Roll back by pointing `current` at an older folder in `releases/`.

Env: `DEPLOY_DIR` (default `/var/www/leapgames`), `DEPLOY_SSH_PORT` (22), `DEPLOY_KEEP` (3).

## Checks after the first deploy

- `curl -sI -H 'Host: leapgames.twentytwosoftware.com' http://127.0.0.1:10486/` on the VPS returns 200.
- `https://leapgames.twentytwosoftware.com/` redirects to `/?mode=games&game=saveux` and SAVE UX starts (mouse works; with a local Leap service the badge hides). Only console errors: the refused `ws://127.0.0.1:6437` when no sensor driver is installed.
- `https://leapgames.twentytwosoftware.com/nope` returns 404; Bias Codex still loads.
