# Kubernetes (reference manifests)

These files are a **starting point** for EKS / GKE / AKS. Tune replicas, resources, probes, ingress TLS, and secrets for your environment.

## Images

Build and push to your registry (examples):

```bash
docker build -f frontend/Dockerfile -t $REGISTRY/hirekaar-web:v1 \
  --build-arg NEXT_PUBLIC_APP_URL="https://app.example.com" \
  ./frontend

docker build -f backend/Dockerfile -t $REGISTRY/hirekaar-api:v1 ./backend
```

Replace image names in the YAML with your `$REGISTRY/...` tags.

## Apply (order matters)

```bash
kubectl apply -f deploy/k8s/namespace.yaml
# Create secrets from the *.example.yaml files (edit values, drop .example from filenames).
kubectl apply -f deploy/k8s/secret-db.yaml
kubectl apply -f deploy/k8s/postgres-statefulset.yaml
kubectl wait --for=condition=ready pod -l app=hirekaar-postgres -n hirekaar --timeout=120s
kubectl apply -f deploy/k8s/secret-api.yaml
kubectl apply -f deploy/k8s/api-deployment.yaml
kubectl apply -f deploy/k8s/secret-web.yaml
kubectl apply -f deploy/k8s/web-deployment.yaml
```

For production databases, prefer **managed Postgres** (RDS, Cloud SQL, Azure Database) instead of the in-cluster StatefulSet.

## Web environment

Mount **`API_BASE_URL`** (in-cluster API base URL, e.g. `http://hirekaar-api:8000`), **`NEXT_PUBLIC_APP_URL`** (public site URL), and **`NODE_ENV=production`** via **`hirekaar-web-env`** (see `secret-web.example.yaml`). The API deployment uses **`envFrom: hirekaar-api-secret`**: include **`DATABASE_URL`**, **`JWT_SECRET`** (strong, ≥24 chars when **`ENVIRONMENT=production`**), **`CORS_ORIGINS`**, **`ENVIRONMENT`**, and optionally **`ALLOW_WALLET_DEMO_TOPUP`** — see **`secret-api.example.yaml`** and root **`.env.example`**.
