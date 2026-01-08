#!/bin/bash
# IPTV Channel Updater - Wrapper Script
# Add to crontab: 0 4 * * * /opt/iptv/update_channels.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/iptv_update.log"

echo "===== $(date) =====" >> "$LOG_FILE"

# Run the Python updater
cd "$SCRIPT_DIR"
python3 update_channels.py >> "$LOG_FILE" 2>&1

# Reload OpenResty to pick up new channels (optional, Lua reloads on request)
# nginx -s reload

echo "Update completed" >> "$LOG_FILE"
