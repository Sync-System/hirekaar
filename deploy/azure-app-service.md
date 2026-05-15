# Azure App Service (containers)

## Web (Next.js standalone)

1. Build **`frontend/Dockerfile`** with **`--build-arg`** for all **`NEXT_PUBLIC_*`** values (see `docker-compose.prod.yml`).
2. Push to **Azure Container Registry**.
3. Create a **Linux Web App for Containers**, set the image, map port **3000** → App Service default (80/443 via platform).
4. In **Configuration → Application settings**, add **`API_BASE_URL`** (HTTPS base URL of your deployed API), **`NEXT_PUBLIC_APP_URL`** (this App Service public URL), and **`NODE_ENV=production`**. Restart the app.

## API (FastAPI + Alembic)

Use a second Web App or **Azure Container Apps** / **AKS** for the Python service. Set **`DATABASE_URL`** to **Azure Database for PostgreSQL** (Flexible Server, v16+ compatible; align engine version with your migration target).

**Migrations:** run **`alembic upgrade head`** as a release step (Azure DevOps / GitHub Actions) or a one-shot job before scaling new API revision — avoid concurrent upgrades from multiple replicas on first boot unless you use a migration lock.

## PostgreSQL

Prefer **Azure Database for PostgreSQL** over running Postgres inside App Service. Point **`DATABASE_URL`** at the flexible server connection string (use `postgresql+psycopg2://` for the API).
