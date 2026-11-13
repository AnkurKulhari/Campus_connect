#!/bin/sh

echo "================================================="
echo "  CampusConnect Backend Starting up on Railway   "
echo "  Port: ${PORT:-8000}                            "
echo "================================================="

# Attempt to run database migrations
echo "==> Running database migrations (alembic upgrade head)..."
if alembic upgrade head; then
    echo "==> Database migrations applied successfully."
else
    echo "=========================================================================="
    echo "⚠️  DATABASE MIGRATION WARNING:"
    echo "Alembic could not complete migrations."
    echo "If using Supabase, ensure you are using the POOLER connection string"
    echo "(port 5432 session or port 6543) instead of direct IPv6 (db.xxx.supabase.co)."
    echo "Starting Uvicorn anyway so the service remains alive and /health responds."
    echo "=========================================================================="
fi

echo "==> Launching Uvicorn server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips='*'
