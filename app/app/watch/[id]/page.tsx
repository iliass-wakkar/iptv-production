"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

interface Channel {
    name: string;
    logo?: string;
    group?: string;
    server_count?: number;
}

// Player page styles
const playerStyles = `
  .player-page {
    min-height: 100vh;
    background: var(--bg-primary);
  }

  .player-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .player-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .back-btn {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: var(--text-primary);
  }

  .player-header h1 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .openresty-badge {
    display: inline-block;
    background: #2e7d32;
    color: white;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .video-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .video-wrapper video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    text-align: center;
    padding: 20px;
  }

  .overlay button {
    margin-top: 20px;
    padding: 12px 24px;
    background: var(--gradient-start);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 16px;
  }

  .player-info {
    padding: 16px;
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .player-info p {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 8px;
  }

  .player-info strong {
    color: var(--text-primary);
  }

  .format-badge {
    display: inline-block;
    background: #1565c0;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    margin-left: 8px;
  }

  .secure-note {
    color: var(--text-muted) !important;
    font-size: 12px !important;
  }

  .server-selector {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    flex-wrap: wrap;
  }

  .server-btn {
    padding: 10px 20px;
    background: var(--bg-card);
    border: 2px solid transparent;
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.3s;
    font-family: inherit;
  }

  .server-btn:hover {
    border-color: var(--gradient-start);
  }

  .server-btn.active {
    background: var(--gradient-start);
    border-color: var(--gradient-start);
  }
`;

export default function WatchPage() {
    const params = useParams();
    const channelId = params.id as string;

    const [channel, setChannel] = useState<Channel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentServer, setCurrentServer] = useState(0);
    const [format, setFormat] = useState("unknown");
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<any>(null);
    const bytesDownloadedRef = useRef(0);
    const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch channel info
    useEffect(() => {
        async function loadChannel() {
            try {
                const res = await fetch("/api/channels");
                const channels = await res.json();
                if (channels[channelId]) {
                    setChannel(channels[channelId]);
                    setLoading(false);
                } else {
                    setError(true);
                    setLoading(false);
                }
            } catch {
                setError(true);
                setLoading(false);
            }
        }
        loadChannel();
    }, [channelId]);

    // Generate unique session ID on mount
    const sessionIdRef = useRef<string>("");
    useEffect(() => {
        sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }, []);

    // Heartbeat for active viewer tracking (every 10 seconds)
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                await fetch("/api/stats", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "heartbeat",
                        session_id: sessionIdRef.current,
                        channel_id: channelId,
                    }),
                });
            } catch {
                // Silently fail
            }
        };

        // Send initial heartbeat
        sendHeartbeat();
        const heartbeatInterval = setInterval(sendHeartbeat, 10000);

        return () => {
            clearInterval(heartbeatInterval);
            // Send end signal
            fetch("/api/stats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "end",
                    session_id: sessionIdRef.current,
                }),
            }).catch(() => { });
        };
    }, [channelId]);

    // Client-side tracking - send stats every 30 seconds
    useEffect(() => {
        const sendStats = async () => {
            if (bytesDownloadedRef.current > 0) {
                try {
                    await fetch("/api/stats", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            channel_id: channelId,
                            bytes: bytesDownloadedRef.current,
                            timestamp: Date.now(),
                            session_id: sessionIdRef.current,
                        }),
                    });
                    bytesDownloadedRef.current = 0; // Reset after sending
                } catch {
                    // Silently fail
                }
            }
        };

        trackingIntervalRef.current = setInterval(sendStats, 30000);

        return () => {
            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
            }
            sendStats(); // Send final stats on unmount
        };
    }, [channelId]);

    // Start player
    const startPlayer = useCallback(async (serverIdx: number) => {
        if (!videoRef.current || !scriptsLoaded) return;

        let streamUrl = "";

        // Fetch signed URL
        try {
            const tokenRes = await fetch(`/api/stream/${channelId}`);
            if (!tokenRes.ok) throw new Error("Token fetch failed");
            const tokenData = await tokenRes.json();
            // Append server index to URL
            // Original: /stream/ch_1?token=...
            // With server: /stream/ch_1/0?token=...
            // Need to handle the path properly
            const [path, query] = tokenData.url.split('?');
            streamUrl = `${path}/${serverIdx}?${query}`;
        } catch (e) {
            console.error("Failed to get token, falling back to simple URL", e);
            streamUrl = `/stream/${channelId}/${serverIdx}`;
        }

        const video = videoRef.current;

        // Cleanup existing player
        if (playerRef.current) {
            if (playerRef.current.destroy) {
                playerRef.current.destroy();
            } else if (playerRef.current.stopLoad) {
                playerRef.current.stopLoad();
                playerRef.current.detachMedia();
            }
            playerRef.current = null;
        }
        video.src = "";

        // Probe stream format
        let detectedFormat = "mpegts";
        try {
            const probe = await fetch(streamUrl, { method: "HEAD" });
            const contentType = probe.headers.get("content-type") || "";
            const finalUrl = probe.url;

            if (contentType.includes("mpegurl") || finalUrl.includes(".m3u8")) {
                detectedFormat = "hls";
            }
        } catch {
            // Default to mpegts
        }

        setFormat(detectedFormat);

        // @ts-ignore - HLS.js global
        if (detectedFormat === "hls" && typeof Hls !== "undefined" && Hls.isSupported()) {
            // @ts-ignore
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
            });

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            // Track bytes for HLS
            hls.on("hlsFragLoaded" in hls ? "hlsFragLoaded" : 2, (_: any, data: any) => {
                if (data?.stats?.total) {
                    bytesDownloadedRef.current += data.stats.total;
                }
            });

            hls.on("hlsManifestParsed" in hls ? "hlsManifestParsed" : 1, () => {
                video.play().catch(() => { });
            });

            playerRef.current = hls;
        }
        // @ts-ignore - mpegts.js global
        else if (typeof mpegts !== "undefined" && mpegts.isSupported()) {
            // @ts-ignore
            const player = mpegts.createPlayer({
                type: "mpegts",
                isLive: true,
                url: streamUrl,
            }, {
                enableWorker: false,
                enableStashBuffer: true,
                stashInitialSize: 1024 * 1024,
                autoCleanupSourceBuffer: true,
            });

            player.attachMediaElement(video);
            player.load();

            // Track bytes for MPEG-TS
            player.on("statistics_info" in player ? "statistics_info" : 1, (stats: any) => {
                if (stats?.downloadSpeed) {
                    bytesDownloadedRef.current += stats.downloadSpeed * 0.5; // Approximate
                }
            });

            video.play().catch(() => { });
            playerRef.current = player;
        } else {
            // Fallback to native
            video.src = streamUrl;
            video.play().catch(() => { });
        }
    }, [channelId, scriptsLoaded]);

    // Start player when channel loads and scripts are ready
    useEffect(() => {
        if (channel && scriptsLoaded) {
            startPlayer(currentServer);
        }
    }, [channel, scriptsLoaded, startPlayer, currentServer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                if (playerRef.current.destroy) {
                    playerRef.current.destroy();
                }
                playerRef.current = null;
            }
        };
    }, []);

    const switchServer = (idx: number) => {
        setCurrentServer(idx);
    };

    return (
        <>
            <style>{playerStyles}</style>

            {/* External player scripts */}
            <Script
                src="https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js"
                onLoad={() => { }}
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js"
                onLoad={() => setScriptsLoaded(true)}
            />

            <div className="player-page">
                <div className="player-container">
                    <header className="player-header">
                        <Link href="/" className="back-btn">
                            ← Back
                        </Link>
                        <h1>
                            {loading ? "Loading..." : channel?.name || "Channel not found"}
                            <span className="openresty-badge">⚡ OpenResty</span>
                        </h1>
                    </header>

                    <div className="video-wrapper">
                        <video ref={videoRef} controls autoPlay playsInline />

                        {loading && (
                            <div className="overlay">
                                <div className="spinner" />
                                <p>Loading stream...</p>
                            </div>
                        )}

                        {error && (
                            <div className="overlay">
                                <p>⚠️ Stream unavailable</p>
                                <button onClick={() => window.location.reload()}>Retry</button>
                            </div>
                        )}
                    </div>

                    <div className="player-info">
                        <p>
                            Channel: <strong>{channel?.name || "Loading..."}</strong>
                            <span className="format-badge">{format.toUpperCase()}</span>
                        </p>
                        <p className="secure-note">🔒 Powered by OpenResty - Ultra Fast Streaming</p>

                        {channel && channel.server_count && channel.server_count > 1 && (
                            <div className="server-selector">
                                <span style={{ color: "var(--text-secondary)" }}>Servers:</span>
                                {Array.from({ length: channel.server_count }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={`server-btn ${i === currentServer ? "active" : ""}`}
                                        onClick={() => switchServer(i)}
                                    >
                                        Server {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
