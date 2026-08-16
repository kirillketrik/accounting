#!/usr/bin/env bash
# Backup/restore the Postgres database via `docker exec`, independent of whether the
# stack is running via docker-compose.yml (prod) or docker-compose.dev.yml (dev) —
# both name the service "postgres", so we find the running container by name.
#
# Usage:
#   ./scripts/backup.sh                  # create a backup (default action)
#   ./scripts/backup.sh backup           # same as above
#   ./scripts/backup.sh list             # list existing backups
#   ./scripts/backup.sh restore <file>   # restore from a backup file (prompts to confirm)
#   ./scripts/backup.sh restore <file> -y  # restore without confirmation prompt
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found. Copy .env.example to .env first." >&2
    exit 1
fi

env_get() {
    local key="$1" default="${2:-}"
    local value
    value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2-)"
    echo "${value:-$default}"
}

POSTGRES_USER="$(env_get POSTGRES_USER accounting)"
POSTGRES_DB="$(env_get POSTGRES_DB accounting)"
BACKUP_DIR="$(env_get BACKUP_DIR backups)"
BACKUP_RETENTION="$(env_get BACKUP_RETENTION 20)"

if [[ "$BACKUP_DIR" != /* ]]; then
    BACKUP_DIR="$REPO_ROOT/$BACKUP_DIR"
fi

find_postgres_container() {
    local container
    container="$(docker ps --filter "name=postgres" --format '{{.Names}}' | head -n1)"
    if [ -z "$container" ]; then
        echo "Error: no running Postgres container found (name matching 'postgres')." >&2
        echo "Start the stack first: ./start.sh dev  (or ./start.sh for prod)" >&2
        exit 1
    fi
    echo "$container"
}

do_backup() {
    local container timestamp file
    container="$(find_postgres_container)"
    mkdir -p "$BACKUP_DIR"
    timestamp="$(date +%Y%m%d_%H%M%S)"
    file="$BACKUP_DIR/${POSTGRES_DB}_${timestamp}.sql.gz"

    echo "Backing up '$POSTGRES_DB' from container '$container' -> $file"
    docker exec "$container" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
        | gzip > "$file"
    echo "Backup written: $file ($(du -h "$file" | cut -f1))"

    prune_old_backups
}

prune_old_backups() {
    local files_to_delete
    files_to_delete="$(ls -1t "$BACKUP_DIR"/"${POSTGRES_DB}"_*.sql.gz 2>/dev/null | tail -n +$((BACKUP_RETENTION + 1)))"
    if [ -n "$files_to_delete" ]; then
        echo "Pruning old backups beyond retention of $BACKUP_RETENTION:"
        while IFS= read -r f; do
            echo "  removing $f"
            rm -f "$f"
        done <<< "$files_to_delete"
    fi
}

do_list() {
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "No backups found in $BACKUP_DIR"
        return
    fi
    ls -lht "$BACKUP_DIR"/"${POSTGRES_DB}"_*.sql.gz 2>/dev/null
}

do_restore() {
    local file="${1:-}" skip_confirm="${2:-}"
    if [ -z "$file" ]; then
        echo "Error: restore requires a backup file path." >&2
        echo "Usage: ./scripts/backup.sh restore <file> [-y]" >&2
        exit 1
    fi
    if [[ "$file" != /* ]]; then
        file="$REPO_ROOT/$file"
    fi
    if [ ! -f "$file" ]; then
        echo "Error: file not found: $file" >&2
        exit 1
    fi

    local container
    container="$(find_postgres_container)"

    if [ "$skip_confirm" != "-y" ]; then
        read -r -p "This will overwrite database '$POSTGRES_DB' in container '$container' with $file. Continue? [y/N] " reply
        if [[ ! "$reply" =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi

    echo "Restoring '$POSTGRES_DB' in container '$container' from $file"
    gunzip -c "$file" | docker exec -i "$container" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    echo "Restore complete."
}

action="${1:-backup}"
case "$action" in
    backup)
        do_backup
        ;;
    list)
        do_list
        ;;
    restore)
        do_restore "${2:-}" "${3:-}"
        ;;
    *)
        echo "Unknown action: $action" >&2
        echo "Usage: ./scripts/backup.sh [backup|list|restore <file> [-y]]" >&2
        exit 1
        ;;
esac
