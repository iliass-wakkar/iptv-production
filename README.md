<div align="center">

# 📺 IPTV Stream Engine & Production Platform

**High-Throughput Live Broadcast Infrastructure with OpenResty, HMAC Security & Dual-Engine Player**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![OpenResty](https://img.shields.io/badge/OpenResty-NGINX%20%2B%20LuaJIT-009900.svg?logo=nginx&logoColor=white)](https://openresty.org/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Containerized-2496ED.svg?logo=docker&logoColor=white)](server/docker-compose.yml)
[![Live Channels](https://img.shields.io/badge/Validated%20Channels-1%2C400%2B%20Live-brightgreen.svg)]()
[![RAM Budget](https://img.shields.io/badge/RAM%20Efficiency-~3MB%20%2F%20Stream-blueviolet.svg)]()
[![Security](https://img.shields.io/badge/Protection-HMAC%20Signed%20Tokens-red.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*Architected & Engineered by **[Iliass Wakkar](https://www.wakkar.net)***

---

</div>

## 📌 Executive Summary

Live video streaming is notoriously demanding on server resources. Unlike standard web transactions where HTTP requests terminate within milliseconds, a live television session maintains an uninterrupted, high-throughput network socket open for hours.

Standard application proxies (Node.js, Python, Go) suffer from three critical bottlenecks:
1. **The RAM Explosion**: Each proxied live stream consumes between **50MB to 100MB of resident RAM** for socket buffers and runtime overhead. On a 1GB RAM cloud VPS, servers crash after just 15 concurrent viewers.
2. **Endpoint Leeching**: Exposing raw upstream stream URLs to client browsers allows scrapers to steal playlists, republish them on public forums, and exhaust upstream servers.
3. **Upstream CDN Volatility**: Live broadcast feeds frequently redirect (HTTP 301, 302, 307), alter token parameters, or experience transient downtime.

**IPTV Production Platform** is an enterprise-grade broadcast architecture engineered to handle **200+ concurrent live streams on a strict 1GB RAM budget**, shield upstream endpoints behind cryptographic HMAC tokens, and deliver seamless playback across **1,400+ validated live channels** via an adaptive **Next.js 16 web player**.

---

## 🏗️ System Architecture

```
[ Client Browser ]
       │
       ▼ HTTPS (/stream/:id?token=TIMESTAMP-SIGNATURE)
┌────────────────────────────────────────────────────────────────────────┐
│ OpenResty Reverse Proxy (NGINX + LuaJIT)                               │
│ ├── 1. Referer Domain Validation (iptv.wakkar.net)                     │
│ ├── 2. Anti-Bot Filter (Blocks direct curl, wget, VLC scrapers)       │
│ ├── 3. HMAC-MD5 Token Verification (60-second validity window)         │
│ ├── 4. In-Memory Route Lookup via lua_shared_dict (Sub-ms routing)     │
│ ├── 5. proxy_buffering OFF (Zero-latency chunk passthrough)            │
│ └── 6. HTTP 302/307 Redirect Interceptor (@handle_redirect)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Non-buffering direct pipe
                                    ▼
       [ Upstream CDN / IPTV Broadcast Nodes ] (Never exposed to client)
```

### Architectural Benchmark

| Metric | Traditional Node / Python Proxy | OpenResty Edge Proxy |
|---|---|---|
| **Resident RAM per Stream** | 60 MB – 100 MB | **~3 MB (95% reduction)** |
| **Max Streams on 1GB VPS** | 12 – 15 viewers | **200+ concurrent viewers** |
| **Stream Endpoint Privacy** | Often exposed in network inspect | **100% shielded via HMAC tokens** |
| **Internal Redirect Handling** | Browser client follows redirect | **Server-side transparent catch** |
| **Hot-Reloading State** | Server restart required | **Sub-second cache flush via API** |

---

## 🛡️ Anti-Leech & Stream Security Perimeter

To prevent unauthorized rebroadcasting, stream URLs are protected through a 3-layer security pipeline executed in LuaJIT before any byte is proxied:

```lua
-- 1. Domain Referer Verification
local referer = ngx.var.http_referer or ""
if referer == "" or not string.find(referer, "iptv.wakkar.net", 1, true) then
    ngx.status = 403
    return ngx.exit(403)
end

-- 2. Anti-Scraper User-Agent Filter
local ua = ngx.var.http_user_agent or ""
if ua == "" or string.find(ua, "curl") or string.find(ua, "wget") or string.find(ua, "VLC") then
    ngx.status = 403
    return ngx.exit(403)
end

-- 3. HMAC-MD5 Short-Lived Token Verification (60s Expiration)
local args = ngx.req.get_uri_args()
local expires_str, signature = (args.token or ""):match("^(%d+)-(.+)$")
if not expires_str or tonumber(expires_str) < ngx.time() then
    ngx.status = 403
    return ngx.exit(403)
end

local calculated_sig = ngx.md5("secure_salt:" .. channel_id .. ":" .. expires_str .. ":" .. secret)
if signature ~= calculated_sig then
    ngx.status = 403
    return ngx.exit(403)
end
```

Any attempt to open stream links in external players (VLC, ffmpeg) or copy-paste into forum playlists immediately yields `403 Forbidden`.

---

## ⚙️ Automated Channel Health & Ingestion Pipeline

Managing 1,400+ live feeds requires continuous automated monitoring. An asynchronous Python pipeline (`update_channels.py`) runs on scheduled cron triggers:

- **High-Concurrency Validation**: Audits hundreds of endpoints concurrently using `ThreadPoolExecutor(max_workers=30)` with strict 8-second HTTP HEAD timeouts.
- **Redundant Server Failover**: Multiple operating streams for the same network are grouped as fallback servers (`server_0`, `server_1`, `server_2`). If the primary feed stutters, the player seamlessly migrates to the backup server.
- **Zero-Downtime Hot Reload**: Validated channels are written into JSON dictionaries and reloaded into OpenResty's `lua_shared_dict channels_cache` via an authenticated `/api/refresh` call without terminating existing active viewer sessions.

---

## 🎬 Dual-Engine Next.js 16 Web Player

Live streams vary in transmission protocol between adaptive HLS playlists (`.m3u8`) and raw MPEG-TS chunked streams. The client-side player performs dynamic protocol probing:

```typescript
// Dual-engine probe in Next.js 16
const probe = await fetch(streamUrl, { method: "HEAD" });
const contentType = probe.headers.get("content-type") || "";

if (contentType.includes("mpegurl") || streamUrl.includes(".m3u8")) {
    // Engine A: HLS.js for Adaptive Bitrate & Quality Ladder
    const hls = new Hls({ lowLatencyMode: true, maxBufferLength: 10 });
    hls.loadSource(streamUrl);
    hls.attachMedia(videoRef.current);
} else {
    // Engine B: mpegts.js for continuous broadcast MPEG-TS streams
    const player = mpegts.createPlayer({ type: "mse", isLive: true, url: streamUrl });
    player.attachMediaElement(videoRef.current);
    player.load();
}
```

### Telemetry & Admin Command Center (`/admin-cp2026`)
- **Real-Time Bandwidth Gauges**: Tracks live aggregate throughput and client data consumption.
- **Heartbeat Monitoring**: Client sends telemetry pings every 30 seconds to track viewer retention and stream health.
- **Channel Manager**: Real-time channel toggling, category management, and log streaming.

---

## 🚀 Quick Start (Local Docker Setup)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)

### Running with Docker Compose:
```bash
# Clone the repository
git clone https://github.com/iliass-wakkar/iptv-production.git
cd iptv-production/server

# Build and start services
docker compose up --build -d
```

Access the application:
- **Web Player**: [http://localhost:8080](http://localhost:8080)
- **Admin Command Center**: `http://localhost:8080/admin-cp2026`

---

## 🚢 CI/CD Deployment Architecture

The repository includes automated GitHub Actions workflows pushing directly to production hosting on **Oracle Cloud Infrastructure (OCI)**:

1. **Commit to `main`**: Triggers automated linting, container image building, and package verification.
2. **SSH Secret Deployment**: Connects securely to the target OCI instance, deploys updated OpenResty configurations, and triggers zero-downtime hot reloads.

### Required GitHub Secrets:
| Secret Key | Description |
|---|---|
| `SSH_PRIVATE_KEY` | Deployer SSH private key |
| `SERVER_IP` | Target production host IP address |

---

## 📂 Repository Structure

```
iptv-production/
├── app/                      # Next.js 16 Web Player frontend
│   ├── src/components/       # Video player, channel grid & telemetry
│   ├── src/app/              # App router & admin control center
│   └── package.json          # Next.js, React 19, HLS.js, mpegts.js
├── server/                   # OpenResty / NGINX reverse proxy
│   ├── nginx.conf            # Lua request pipeline & HMAC verification
│   ├── Dockerfile            # OpenResty production image
│   └── docker-compose.yml    # Service orchestration
├── tools/                    # Automated Python scraping & validation tools
│   ├── update_channels.py    # Multi-threaded channel health verifier
│   └── parse_m3u.py          # M3U playlist parser & category normalizer
├── .github/workflows/        # Automated OCI deployment workflows
├── .gitignore                # Environment, keys, and log exclusions
└── README.md                 # Production architecture documentation
```

---

## 👤 Author

**Iliass Wakkar**
- Portfolio: [wakkar.net](https://www.wakkar.net)
- GitHub: [@iliass-wakkar](https://github.com/iliass-wakkar)
- LinkedIn: [linkedin.com/in/iliass-wakkar-940233335](https://www.linkedin.com/in/iliass-wakkar-940233335/)
- Case Study: [IPTV Streaming Platform Case Study](https://www.wakkar.net/projects/iptv-streaming-platform)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
