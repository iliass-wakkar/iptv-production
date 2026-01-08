#!/bin/bash
# Automatic database backup script
# Runs daily at 3 AM via cron

BACKUP_DIR="/backups"
DB_PATH="/etc/openresty/data/iptv.db"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/iptv_${DATE}.db"
KEEP_DAYS=7

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo "Database not found at ${DB_PATH}"
    exit 1
fi

# Create backup
echo "Creating backup: ${BACKUP_FILE}"
cp "${DB_PATH}" "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null)
    echo "Backup successful: ${BACKUP_FILE} (${SIZE} bytes)"
    
    # Log to database via Python
    python3 -c "
import sys
sys.path.insert(0, '/etc/openresty/auth')
import database as db
db.add_backup_log('${BACKUP_FILE}', ${SIZE}, 'success')
db.add_server_log('info', 'backup', 'Automatic backup created: ${BACKUP_FILE}')
"
else
    echo "Backup failed!"
    python3 -c "
import sys
sys.path.insert(0, '/etc/openresty/auth')
import database as db
db.add_backup_log('', 0, 'failed')
db.add_server_log('error', 'backup', 'Automatic backup failed')
"
    exit 1
fi

# Delete old backups (keep last KEEP_DAYS days)
echo "Cleaning old backups (keeping last ${KEEP_DAYS} days)..."
find ${BACKUP_DIR} -name "iptv_*.db" -type f -mtime +${KEEP_DAYS} -delete

echo "Backup complete!"
