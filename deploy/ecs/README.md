# Amazon ECS (Fargate or EC2)

## Pattern

1. **ECR** — push `hirekaar-web` and `hirekaar-api` images (see `deploy/k8s/README.md` build commands with your registry URL replaced by `ACCOUNT.dkr.ecr.REGION.amazonaws.com/hirekaar-...`).
2. **RDS PostgreSQL** (recommended) or self-managed Postgres — create database `hirekaar` and user; use the connection string as **`DATABASE_URL`** for the API task (SQLAlchemy format: `postgresql+psycopg2://user:pass@host:5432/hirekaar`).
3. **Secrets Manager / SSM** — store `DATABASE_URL`, `NEXT_PUBLIC_*`, and any server keys; inject as task definition secrets.
4. **Task definitions**
   - **API**: container port **8000**, command from image entrypoint (Alembic upgrade + uvicorn). For many releases, run migrations as a **one-shot task** before deploying new API revision instead of on every container start.
   - **Web**: container port **3000**, environment from secrets; target group health check **`/api/health`**.
5. **ALB** — two target groups (web + api) or path-based routing (`/api/*` to API if you later proxy — today Next owns `/api/*` routes; keep **separate hostnames** unless you change routing).

## EC2 + Docker Compose

On a single EC2 instance, install Docker and use the repo’s **`docker-compose.yml`** (and **`docker-compose.prod.yml`** for production web builds). Put a root **`.env`** on the instance (not in the image). Open security groups for **3000** (web), **8000** (api) if needed, and restrict sources.
