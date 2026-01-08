# IPTV Production

Live TV streaming platform with Next.js frontend and OpenResty/NGINX backend.

## Quick Start (Local)

```bash
cd server
docker compose up --build -d
```

Visit: <http://localhost:8080>

## CI/CD Deployment

Push to `main` branch → Auto-deploys to production server.

### Setup GitHub Secrets

Go to: Repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `SSH_PRIVATE_KEY` | Contents of your SSH private key file |
| `SERVER_IP` | `141.253.101.175` |

### Manual Trigger

Go to: Actions → Deploy IPTV → Run workflow

## Structure

```
iptv-production/
├── app/          # Next.js frontend
├── server/       # NGINX + Docker
├── sources/      # Channel sources (git-ignored)
└── keys/         # SSH keys (git-ignored)
```

## Admin

- URL: `https://iptv.wakkar.net/admin-cp2026`
- Password: Set in `.env` file
