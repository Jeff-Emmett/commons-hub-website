<h1 align="center">Commons Hub Website</h1>

The website for the [Commons Hub](https://www.commons-hub.at) — a community
guesthouse and event venue in the Austrian Alps. Built with Next.js (App
Router) and next-intl (multilingual: EN/DE/HU/CS/SK).

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Repositories

- **Primary:** Gitea — `ssh://git@gitea.jeffemmett.com:223/jeffemmett/commons-hub-website.git`
- **Mirror:** [GitHub](https://github.com/Jeff-Emmett/commons-hub-website) (public, downstream backup)

Work on `dev`; deploy from `main`.

## Deployment (auto)

Production runs on Netcup (`/opt/apps/commons-hub-app`, container
`commons-hub-web`, behind Traefik + Cloudflare). Deploys are **automatic on push
to `main`**:

```
push origin main → Gitea webhook → deploy.jeffemmett.com/deploy/commons-hub-website
                 → git reset --hard origin/main → docker compose up -d --build
```

The server dir is a Gitea checkout pinned to `main`; server-only files (`.env`,
`docker-compose.yml`) are untracked and preserved across deploys. Pushing `dev`
does **not** deploy.
