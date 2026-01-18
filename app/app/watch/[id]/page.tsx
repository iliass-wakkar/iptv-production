"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import NativeBanner from "@/components/NativeBanner";
import SocialBar from "@/components/SocialBar";
import Popunder from "@/components/Popunder";

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

  /* Navbar with 468x60 banner */
  .player-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: rgba(5, 5, 5, 0.9);
    border-bottom: 1px solid var(--border);
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .nav-logo {
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-decoration: none;
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

  /* 728x90 Leaderboard */
  .leaderboard-ad {
    display: flex;
    justify-content: center;
    padding: 15px 0;
    background: rgba(0,0,0,0.3);
  }

  /* Main layout with sidebars */
  .player-layout {
    display: flex;
    gap: 20px;
    max-width: 1600px;
    margin: 0 auto;
    padding: 20px;
  }

  /* Left sidebar ad */
  .ad-sidebar-left {
    flex: 0 0 160px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Right sidebar ads */
  .ad-sidebar-right {
    flex: 0 0 300px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Center content */
  .player-center {
    flex: 1;
    min-width: 0;
  }

  .player-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }

  .player-header h1 {
    font-size: 18px;
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
    margin-bottom: 15px;
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
    background: rgba(0, 0, 0, 0.85);
    color: white;
    text-align: center;
  }

  .overlay button {
    margin-top: 20px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .overlay button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Minimalist loading spinner - iOS style */
  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Poster background - darkened */
  .video-poster-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.4);
  }

  .video-poster-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 200px;
    max-height: 120px;
    object-fit: contain;
    z-index: 1;
    opacity: 0.8;
  }

  /* Minimalist Play Button - HBO/Disney+ style */
  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
  }

  .play-button {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(4px);
  }

  .play-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .play-button svg {
    width: 32px;
    height: 32px;
    fill: white;
    margin-left: 4px; /* Optical centering */
  }

  /* Player info with native banner beside it */
  .player-info-row {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .player-info {
    flex: 1;
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

  /* Native banner area */
  .native-banner-container {
    flex: 0 0 300px;
    max-width: 300px;
  }

  /* Bottom mobile banner */
  .bottom-ad {
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }

  /* Responsive - hide sidebars on mobile */
  @media (max-width: 1200px) {
    .ad-sidebar-left {
      display: none;
    }
    .ad-sidebar-right {
      display: none;
    }
    .native-banner-container {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .player-layout {
      padding: 10px;
    }
    .leaderboard-ad {
      display: none;
    }
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
    const [isPlaying, setIsPlaying] = useState(false); // User clicked play

    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<any>(null);
    const bytesDownloadedRef = useRef(0);
    const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load external scripts on mount
    useEffect(() => {
        // Check if already loaded
        if (typeof window !== 'undefined' && (window as any).mpegts) {
            setScriptsLoaded(true);
            return;
        }

        const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js'),
            loadScript('https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js')
        ]).then(() => {
            setScriptsLoaded(true);
        }).catch(err => {
            console.error('Failed to load player scripts:', err);
        });
    }, []);

    // Fetch channel info
    useEffect(() => {
        // Reset state when channelId changes
        setChannel(null);
        setLoading(true);
        setError(false);
        setCurrentServer(0);
        setFormat("unknown");

        // Cleanup existing player when navigating
        if (playerRef.current) {
            if (playerRef.current.destroy) {
                playerRef.current.destroy();
            } else if (playerRef.current.stopLoad) {
                playerRef.current.stopLoad();
                playerRef.current.detachMedia();
            }
            playerRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.src = "";
        }

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
                // Seek to live edge before playing
                if (hls.liveSyncPosition) {
                    video.currentTime = hls.liveSyncPosition;
                }
                video.play().catch(() => { });
                setLoading(false);
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

            // Use video 'playing' event - most reliable way to know stream started
            video.onplaying = () => {
                setLoading(false);
            };

            // Start playback
            video.play().catch(() => { });

            playerRef.current = player;
        } else {
            // Fallback to native
            video.src = streamUrl;
            video.onplaying = () => {
                setLoading(false);
            };
            video.play().catch(() => { });
        }
    }, [channelId, scriptsLoaded]);

    // Start player only when user clicks play (lazy load)
    useEffect(() => {
        if (channel && scriptsLoaded && isPlaying) {
            startPlayer(currentServer);
        }
    }, [channel, scriptsLoaded, startPlayer, currentServer, isPlaying]);

    // Handle play button click
    const handlePlay = () => {
        setIsPlaying(true);
        setLoading(true);
    };

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

            {/* Global ads - Popunder + Social Bar */}
            <Popunder />
            <SocialBar />

            <div className="player-page">
                {/* Navbar with 468x60 banner */}
                <nav className="player-nav">
                    <div className="nav-left">
                        <Link href="/" className="nav-logo">IPTV</Link>
                        <Link href="/" className="back-btn">← Back to channels</Link>
                    </div>
                    <AdBanner adKey="5c1bad559da4a50104d327c162cdc746" width={468} height={60} />
                </nav>

                {/* 728x90 Leaderboard */}
                <div className="leaderboard-ad">
                    <AdBanner adKey="c8497da66b156445a151c369365cfec8" width={728} height={90} />
                </div>

                {/* Main layout with sidebars */}
                <div className="player-layout">
                    {/* Left Sidebar - 160x600 */}
                    <aside className="ad-sidebar-left">
                        <AdBanner adKey="f4f75dd9ec066f77eda187fd5d7c9b14" width={160} height={600} />
                    </aside>

                    {/* Center - Player */}
                    <div className="player-center">
                        <header className="player-header">
                            <h1>
                                {loading ? "Loading..." : channel?.name || "Channel not found"}
                                <span className="openresty-badge">⚡ OpenResty</span>
                            </h1>
                        </header>

                        <div className="video-wrapper">
                            {/* Darkened poster background + logo (shown before play) */}
                            {!isPlaying && channel?.logo && (
                                <>
                                    <div
                                        className="video-poster-bg"
                                        style={{ backgroundImage: `url(${channel.logo})` }}
                                    />
                                    <img
                                        src={channel.logo}
                                        alt=""
                                        className="video-poster-logo"
                                    />
                                </>
                            )}

                            {/* Minimalist Play Button - shown before user clicks */}
                            {!isPlaying && !loading && (
                                <div className="play-overlay" onClick={handlePlay}>
                                    <div className="play-button">
                                        <svg viewBox="0 0 24 24">
                                            <polygon points="5,3 19,12 5,21" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                controls
                                playsInline
                                style={{ display: isPlaying ? 'block' : 'none' }}
                            />

                            {/* Loading spinner - only when playing */}
                            {loading && isPlaying && (
                                <div className="overlay">
                                    <div className="spinner" />
                                </div>
                            )}

                            {error && (
                                <div className="overlay">
                                    <p>⚠️ Stream unavailable</p>
                                    <button onClick={() => window.location.reload()}>Retry</button>
                                </div>
                            )}
                        </div>

                        {/* Player info + Native Banner */}
                        <div className="player-info-row">
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

                    {/* Right Sidebar - 160x300 + 300x250 + Native */}
                    <aside className="ad-sidebar-right">
                        <AdBanner adKey="03c5896734fc5b90882213eba8126ed8" width={160} height={300} />
                        <AdBanner adKey="0bbd75a017db7c965294b3f14e4f65fb" width={300} height={250} />
                        <NativeBanner />
                    </aside>
                </div>

                {/* Bottom 320x50 Mobile Banner */}
                <div className="bottom-ad">
                    <AdBanner adKey="0cc029fe0605b3e9aa8137e32e3e3689" width={320} height={50} />
                </div>
            </div>
        </>
    );
}
