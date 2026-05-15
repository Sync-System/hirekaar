# HirKaar backend — Alembic migrations + FastAPI (Postgres / Neon / RDS / etc.).
# Build with this directory as context:
#
#   docker build -f Dockerfile -t hirekaar-api .
#   (run from ./backend, or: docker build -f backend/Dockerfile -t hirekaar-api ./backend)
#
FROM python:3.12-slim-bookworm

WORKDIR /app

# So `python scripts/…py` can `import app` (script dir is on sys.path, not repo root).
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends libpq5 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
