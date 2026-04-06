#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Backup Script for Sentral
# Usage: ./scripts/backup.sh
# Cron example: 0 2 * * * /path/to/sentral/scripts/backup.sh

BACKUP_DIR="${BACKUP_DIR:-/backups/sentral}"
CONTAINER_NAME="${CONTAINER_NAME:-sentral-db}"
DB_NAME="${DB_NAME:-sentral_dev}"
DB_USER="${DB_USER:-sentral}"
KEEP_DAILY=7
KEEP_WEEKLY=4

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)
FILENAME="sentral_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup..."

# Dump and compress
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/daily/$FILENAME"

echo "[$(date)] Daily backup created: $FILENAME"

# Copy to weekly on Sundays (day 7)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  cp "$BACKUP_DIR/daily/$FILENAME" "$BACKUP_DIR/weekly/$FILENAME"
  echo "[$(date)] Weekly backup created: $FILENAME"
fi

# Rotate daily backups (keep last N)
cd "$BACKUP_DIR/daily"
ls -t *.sql.gz 2>/dev/null | tail -n +$((KEEP_DAILY + 1)) | xargs -r rm --
echo "[$(date)] Rotated daily backups (keeping last $KEEP_DAILY)"

# Rotate weekly backups (keep last N)
cd "$BACKUP_DIR/weekly"
ls -t *.sql.gz 2>/dev/null | tail -n +$((KEEP_WEEKLY + 1)) | xargs -r rm --
echo "[$(date)] Rotated weekly backups (keeping last $KEEP_WEEKLY)"

echo "[$(date)] Backup complete!"
