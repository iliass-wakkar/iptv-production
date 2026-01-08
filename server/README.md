# IPTV Web Player (OpenResty)

High-performance IPTV streaming server using OpenResty (NGINX + Lua).

## Features

- 🚀 **Ultra-light**: ~3MB RAM per stream (vs 100MB with Python)
- 📺 **1400+ channels**: Auto-validated from multiple sources
- 🔄 **Auto-updates**: Daily cron job fetches fresh channels
- 🔒 **URL hiding**: Stream URLs never exposed to browser
- 🎛️ **Multi-server**: Channels have backup servers

## Quick Start

```bash
# Build
docker build -t iptv-openresty .

# Run
docker run -d -p 80:80 --name iptv iptv-openresty

# Open browser
http://localhost
```

## Files

```
├── Dockerfile          # Docker build config
├── nginx.conf          # NGINX + Lua config
├── lua/channels.lua    # Channel API handler
├── html/               # Frontend (index, player, css)
├── data/channels.json  # Validated channel data
├── update_channels.py  # Daily updater script
└── update_channels.sh  # Cron wrapper
```

## Update Channels

```bash
# Manual update
python update_channels.py

# Auto-update runs daily at 4 AM via cron
```

## Deploy to Oracle Cloud

```bash
# SSH to Oracle
ssh ubuntu@YOUR_IP

# Pull and run
docker pull your-registry/iptv-openresty
docker run -d -p 80:80 --name iptv iptv-openresty
```

## Capacity

| Resource | Value |
|----------|-------|
| RAM usage | ~3MB per stream |
| Max users (1GB RAM) | 200+ concurrent |
| Bandwidth (free tier) | 10TB/month |
