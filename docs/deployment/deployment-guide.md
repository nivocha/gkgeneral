# Deployment Guide — GK General Supply

## Prerequisites

- Docker & Docker Compose v3.8+
- PostgreSQL 16 (or use the provided Docker service)
- ImageKit account (for product image upload)
- EvMak account (for online payments)
- Domain name with DNS pointing to your server
- Node.js 22 (for local builds/development)

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BETTER_AUTH_SECRET` | Auth secret (32+ chars) | Yes |
| `BETTER_AUTH_URL` | App URL for auth callbacks | Yes |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | Yes |
| `NEXT_PUBLIC_APP_NAME` | App display name | Yes |
| `NEXT_PUBLIC_APP_DESCRIPTION` | App description (SEO) | Yes |
| `FORCE_HTTPS` | Redirect HTTP → HTTPS | Yes |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key | No |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key | No |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit endpoint URL | No |
| `EVMAK_API_KEY` | EvMak payment API key | No |
| `EVMAK_API_URL` | EvMak API base URL | No |
| `EVMAK_WEBHOOK_SECRET` | EvMak webhook signing secret | No |

## DigitalOcean Deployment

### Option A: App Platform (PaaS)

1. Push code to GitHub.
2. In DigitalOcean App Platform, create a new app from GitHub.
3. Set source directory to `/` (root).
4. Select **Dockerfile** as the build method.
5. Add a **PostgreSQL** dev database as a component (or use managed DB).
6. Set all environment variables from `.env.production.example`.
7. Set HTTP port to `3000`.
8. Enable HTTPS (automatic with App Platform).
9. Deploy.

### Option B: Droplet (VPS) with Docker Compose

1. Create a Ubuntu 24.04 Droplet (minimum 2 GB RAM, 2 vCPUs).
2. Install Docker and Docker Compose:
   ```bash
   apt update && apt install -y docker.io docker-compose-plugin
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/your-org/gk-general-supply.git /opt/app
   cd /opt/app
   ```
4. Create `.env.production` with all environment variables from `.env.production.example`.
5. Run the stack:
   ```bash
   docker compose -f docker-compose.production.yml up -d
   ```
6. Run database migrations:
   ```bash
   docker compose -f docker-compose.production.yml exec app npx prisma db push
   ```
   Or use `npx prisma migrate deploy` if migration files exist.

## SSL / Certbot

If using a Droplet without a reverse proxy:

1. Install Certbot:
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```
2. Obtain certificate:
   ```bash
   certbot --nginx -d your-domain.com
   ```
3. Certbot auto-renews via systemd timer.

For NGINX reverse proxy (recommended):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Migration

```bash
# Push schema (dev/staging — no history)
docker compose -f docker-compose.production.yml exec app npx prisma db push

# Migrate (production — with migration history)
docker compose -f docker-compose.production.yml exec app npx prisma migrate deploy

# Seed initial data
docker compose -f docker-compose.production.yml exec app npx prisma db seed
```

## Monitoring & Logging

```bash
# View app logs
docker compose -f docker-compose.production.yml logs -f app

# View database logs
docker compose -f docker-compose.production.yml logs -f postgres

# Container health
docker compose -f docker-compose.production.yml ps
```

For production monitoring, consider:

- **DigitalOcean Monitoring** (built-in for App Platform)
- **Prometheus + Grafana** for advanced metrics
- **Sentinel** or **Better Stack** for uptime monitoring

## Backup Strategy

### Database backups (daily cron):

```bash
0 3 * * * docker exec gk-postgres pg_dump -U gk_user gk_general_supply | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

### Backup rotation (keep 30 days):

```bash
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

### App data:

- User-uploaded images are stored in ImageKit (external), no local backup needed.
- Session data is stored in the database (included in DB backup).

## Rollback Procedure

### Docker Compose rollback:

```bash
# Revert to previous build
docker compose -f docker-compose.production.yml down
git checkout <previous-tag-or-commit>
docker compose -f docker-compose.production.yml up -d --build

# Database rollback (if migration was the issue)
docker compose -f docker-compose.production.yml exec app npx prisma migrate resolve --rolled-back <migration-name>
```

### App Platform rollback:

1. Go to App Platform dashboard.
2. Select the app → **Components** → **app**.
3. Click the deployed image tag → **Deploy previous image**.
