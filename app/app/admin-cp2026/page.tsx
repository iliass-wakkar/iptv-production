"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Admin page styles - Command Center theme
const adminStyles = `
  :root {
    --bg-primary: #0f0f0f;
    --bg-secondary: #1a1a1a;
    --bg-card: #1E1E1E;
    --bg-sidebar: #141414;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --text-dim: #666666;
    --accent-primary: #8b5cf6;
    --accent-secondary: #a855f7;
    --accent-cyan: #22d3ee;
    --accent-green: #22c55e;
    --accent-yellow: #eab308;
    --accent-red: #ef4444;
    --accent-blue: #3b82f6;
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-glow: rgba(139, 92, 246, 0.5);
    --glass-bg: rgba(30, 30, 30, 0.8);
  }

  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--bg-primary);
  }

  /* Sidebar */
  .sidebar {
    width: 240px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
  }

  .sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .sidebar-header h1 {
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-primary);
  }

  .sidebar-header h1 span { color: var(--accent-primary); }

  .sidebar-nav { flex: 1; padding: 16px 12px; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    margin-bottom: 4px;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: rgba(139, 92, 246, 0.15);
    color: var(--text-primary);
    border-left-color: var(--accent-primary);
    box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.1);
  }

  .nav-item .icon { font-size: 1.2rem; width: 24px; text-align: center; }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid var(--border-subtle);
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    padding: 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .back-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 240px;
    padding: 24px 32px;
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid var(--border-subtle);
    background: transparent;
    color: var(--text-secondary);
  }

  .btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .btn-primary {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-secondary);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  .stat-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  .stat-icon.blue { background: rgba(59, 130, 246, 0.2); }
  .stat-icon.green { background: rgba(34, 197, 94, 0.2); }
  .stat-icon.purple { background: rgba(139, 92, 246, 0.2); }
  .stat-icon.cyan { background: rgba(34, 211, 238, 0.2); }
  .stat-icon.red { background: rgba(239, 68, 68, 0.2); }
  .stat-icon.yellow { background: rgba(234, 179, 8, 0.2); }

  .stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--text-primary);
  }

  .stat-value.green { color: var(--accent-green); }
  .stat-value.cyan { color: var(--accent-cyan); }
  .stat-value.red { color: var(--accent-red); }
  .stat-value.blue { color: var(--accent-blue); }

  .stat-subtext {
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  /* Progress Bar */
  .progress-container { margin-top: 12px; }

  .progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
    background: linear-gradient(90deg, #22c55e, #4ade80);
  }

  /* Panels */
  .panel {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .panel-title {
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-primary);
  }

  .panel-title .icon { color: var(--accent-cyan); }

  /* Chart */
  .chart-area {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 180px;
    padding: 0 10px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .chart-bar-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }

  .chart-bar {
    width: 70%;
    background: linear-gradient(180deg, var(--accent-cyan), rgba(34, 211, 238, 0.2));
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    transition: all 0.2s;
  }

  .chart-bar:hover {
    filter: brightness(1.2);
    box-shadow: 0 0 15px rgba(34, 211, 238, 0.4);
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    padding: 10px 10px 0;
  }

  .chart-labels span {
    flex: 1;
    text-align: center;
    font-size: 0.7rem;
    color: var(--text-dim);
  }

  /* Loading */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--accent-cyan);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Top Channels Table */
  .channels-table {
    width: 100%;
    border-collapse: collapse;
  }

  .channels-table th, .channels-table td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle);
  }

  .channels-table th {
    font-size: 0.75rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  .channels-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .channels-table td { font-size: 0.9rem; color: var(--text-primary); }
`;

// Helper to format bytes
function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface Stats {
    totalBytes: number;
    todayBytes: number;
    totalViews: number;
    activeViewers: number;
    activeByChannel: Record<string, number>;
    hourlyStats: Record<string, { bytes: number; views: number }>;
    topChannels: [string, { bytes: number; views: number }][];
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [stats, setStats] = useState<Stats | null>(null);
    const [channels, setChannels] = useState<Record<string, { name: string }>>({});
    const [logs, setLogs] = useState<string[]>([]);
    const [logFilter, setLogFilter] = useState<'all' | 'success' | 'warnings' | 'errors'>('all');
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    // Check auth on mount
    useEffect(() => {
        const validateSession = async () => {
            const token = sessionStorage.getItem("admin-token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/auth", {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.valid) {
                        setAuthenticated(true);
                        loadStats();
                        return;
                    }
                }

                // Invalid session, clear it
                sessionStorage.removeItem("admin-token");
            } catch {
                // Network error, keep session for offline use
            }
            setLoading(false);
        };

        validateSession();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                sessionStorage.setItem("admin-token", data.token);
                setAuthenticated(true);
                loadStats();
            } else {
                setLoginError(data.error || "Login failed");
            }
        } catch {
            setLoginError("Network error. Please try again.");
        }

        setLoginLoading(false);
    };

    const handleLogout = async () => {
        const token = sessionStorage.getItem("admin-token");
        if (token) {
            await fetch("/api/auth", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            }).catch(() => { });
        }
        sessionStorage.removeItem("admin-token");
        setAuthenticated(false);
        setStats(null);
    };

    const loadStats = async () => {
        setLoading(true);
        try {
            // Load stats
            const res = await fetch("/api/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }

            // Load channels for name lookup
            const channelsRes = await fetch("/api/channels");
            if (channelsRes.ok) {
                const channelsData = await channelsRes.json();
                setChannels(channelsData);
            }

            // Load logs
            const logsRes = await fetch("/api/logs");
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setLogs(logsData.logs || []);
            }
        } catch {
            console.error("Failed to load stats");
        }
        setLoading(false);
    };

    // Get last 7 days for chart
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().substring(0, 10));
        }
        return days;
    };

    // Calculate daily bytes from hourly stats
    const getDailyBytes = (date: string): number => {
        if (!stats?.hourlyStats) return 0;
        let total = 0;
        for (const [hour, data] of Object.entries(stats.hourlyStats)) {
            if (hour.startsWith(date)) {
                total += data.bytes;
            }
        }
        return total;
    };

    if (!authenticated) {
        return (
            <>
                <style>{adminStyles}</style>
                <div className="admin-layout" style={{ justifyContent: "center", alignItems: "center" }}>
                    <div className="panel" style={{ maxWidth: 400, width: "100%" }}>
                        <h2 className="panel-title" style={{ marginBottom: 20, justifyContent: "center" }}>
                            🔐 Admin Login
                        </h2>
                        {loginError && (
                            <div style={{
                                padding: "12px 16px",
                                marginBottom: 16,
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: 8,
                                color: "#ef4444",
                                fontSize: "0.9rem",
                            }}>
                                ⚠️ {loginError}
                            </div>
                        )}
                        <form onSubmit={handleLogin}>
                            <input
                                type="password"
                                placeholder="Enter admin password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loginLoading}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    marginBottom: 16,
                                    background: "var(--bg-secondary)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: 8,
                                    color: "var(--text-primary)",
                                    fontSize: "1rem",
                                }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={loginLoading}
                            >
                                {loginLoading ? "⏳ Logging in..." : "Login"}
                            </button>
                        </form>
                    </div>
                </div>
            </>
        );
    }

    const days = getLast7Days();
    const maxBytes = Math.max(...days.map(d => getDailyBytes(d)), 1);

    return (
        <>
            <style>{adminStyles}</style>
            <div className="admin-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h1>🚀 <span>Command</span> Center</h1>
                    </div>
                    <nav className="sidebar-nav">
                        <div className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                            <span className="icon">📊</span>
                            <span>Dashboard</span>
                        </div>
                        <div className={`nav-item ${activeTab === "bandwidth" ? "active" : ""}`} onClick={() => setActiveTab("bandwidth")}>
                            <span className="icon">📈</span>
                            <span>Bandwidth</span>
                        </div>
                        <div className={`nav-item ${activeTab === "channels" ? "active" : ""}`} onClick={() => setActiveTab("channels")}>
                            <span className="icon">📺</span>
                            <span>Top Channels</span>
                        </div>
                        <div className={`nav-item ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>
                            <span className="icon">📋</span>
                            <span>Server Logs</span>
                        </div>
                    </nav>
                    <div className="sidebar-footer">
                        <Link href="/" className="back-link">
                            <span>←</span>
                            <span>Back to Player</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={{
                                marginTop: "12px",
                                width: "100%",
                                padding: "10px",
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "8px",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                            }}
                        >
                            🚪 Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {activeTab === "dashboard" && (
                        <>
                            <div className="page-header">
                                <h2 className="page-title">Dashboard Overview</h2>
                                <button className="btn" onClick={loadStats}>🔄 Refresh</button>
                            </div>

                            {loading ? (
                                <div className="loading"><div className="spinner" /></div>
                            ) : (
                                <>
                                    {/* Stats Grid */}
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <div className="stat-header">
                                                <div className="stat-icon cyan">📺</div>
                                                <span className="stat-label">Total Views</span>
                                            </div>
                                            <div className="stat-value cyan">{stats?.totalViews?.toLocaleString() || 0}</div>
                                            <div className="stat-subtext">All time</div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-header">
                                                <div className="stat-icon green">👁️</div>
                                                <span className="stat-label">Active Viewers</span>
                                            </div>
                                            <div className="stat-value green" style={{ color: stats?.activeViewers ? "#22c55e" : "#666" }}>
                                                {stats?.activeViewers || 0}
                                            </div>
                                            <div className="stat-subtext">Watching now</div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-header">
                                                <div className="stat-icon green">📊</div>
                                                <span className="stat-label">Bandwidth Today</span>
                                            </div>
                                            <div className="stat-value green">{formatBytes(stats?.todayBytes || 0)}</div>
                                            <div className="stat-subtext">Data transferred</div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-header">
                                                <div className="stat-icon purple">📈</div>
                                                <span className="stat-label">Total Bandwidth</span>
                                            </div>
                                            <div className="stat-value">{formatBytes(stats?.totalBytes || 0)}</div>
                                            <div className="stat-subtext">All time usage</div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-header">
                                                <div className="stat-icon blue">📡</div>
                                                <span className="stat-label">Top Channels</span>
                                            </div>
                                            <div className="stat-value blue">{stats?.topChannels?.length || 0}</div>
                                            <div className="stat-subtext">Tracked channels</div>
                                        </div>
                                    </div>

                                    {/* Chart */}
                                    <div className="panel">
                                        <div className="panel-header">
                                            <h3 className="panel-title">
                                                <span className="icon">📊</span>
                                                Bandwidth (Last 7 Days)
                                            </h3>
                                        </div>
                                        <div className="chart-area">
                                            {days.map((day) => {
                                                const bytes = getDailyBytes(day);
                                                const height = Math.max((bytes / maxBytes) * 100, 2);
                                                return (
                                                    <div key={day} className="chart-bar-wrapper">
                                                        <div
                                                            className="chart-bar"
                                                            style={{ height: `${height}%` }}
                                                            title={`${day}: ${formatBytes(bytes)}`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="chart-labels">
                                            {days.map((day) => (
                                                <span key={day}>{day.substring(5)}</span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {activeTab === "bandwidth" && (
                        <>
                            <div className="page-header">
                                <h2 className="page-title">Bandwidth Details</h2>
                            </div>
                            <div className="panel">
                                <h3 className="panel-title" style={{ marginBottom: 20 }}>
                                    <span className="icon">📈</span>
                                    Daily Breakdown
                                </h3>
                                <table className="channels-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Bandwidth</th>
                                            <th>Views</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {days.map((day) => {
                                            const bytes = getDailyBytes(day);
                                            const views = Object.entries(stats?.hourlyStats || {})
                                                .filter(([h]) => h.startsWith(day))
                                                .reduce((sum, [, d]) => sum + d.views, 0);
                                            return (
                                                <tr key={day}>
                                                    <td>{day}</td>
                                                    <td>{formatBytes(bytes)}</td>
                                                    <td>{views}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === "channels" && (
                        <>
                            <div className="page-header">
                                <h2 className="page-title">Top Channels</h2>
                            </div>
                            <div className="panel">
                                <table className="channels-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Channel ID</th>
                                            <th>Views</th>
                                            <th>Bandwidth</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.topChannels?.map(([channelId, data], idx) => (
                                            <tr key={channelId}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{channelId}</span>
                                                    <br />
                                                    <strong>{channels[channelId]?.name || channelId}</strong>
                                                </td>
                                                <td>{data.views}</td>
                                                <td>{formatBytes(data.bytes)}</td>
                                            </tr>
                                        ))}
                                        {(!stats?.topChannels || stats.topChannels.length === 0) && (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: "center", color: "var(--text-dim)" }}>
                                                    No data yet. Start watching channels to see stats.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === "logs" && (() => {
                        // Parse NGINX log line
                        const parseLog = (line: string) => {
                            // Format: 127.0.0.1 - - [07/Jan/2026:23:35:09 +0000] "GET /path HTTP/1.1" 200 1234 "-" "User-Agent"
                            const match = line.match(/^(\S+) .* \[([^\]]+)\] "(\S+) ([^"]+) HTTP[^"]*" (\d+) (\d+|-) "[^"]*" "([^"]*)"/);
                            if (!match) return null;

                            const [, ip, timestamp, method, fullPath, status, , userAgent] = match;
                            // Clean path - remove token params
                            const path = fullPath.split('?')[0];
                            // Parse timestamp
                            const timePart = timestamp.split(':').slice(1, 3).join(':');
                            // Simplify user agent
                            let agent = 'Unknown';
                            if (userAgent.includes('Chrome')) agent = 'Chrome';
                            else if (userAgent.includes('Firefox')) agent = 'Firefox';
                            else if (userAgent.includes('Safari')) agent = 'Safari';
                            else if (userAgent.includes('curl')) agent = 'curl';
                            else if (userAgent.includes('VLC')) agent = 'VLC';

                            return { ip, time: timePart, method, path, status: parseInt(status), agent };
                        };

                        // logFilter state is at component level

                        const parsedLogs = logs
                            .map(parseLog)
                            .filter((log): log is NonNullable<typeof log> => log !== null)
                            .filter(log => {
                                if (logFilter === 'success') return log.status >= 200 && log.status < 300;
                                if (logFilter === 'warnings') return log.status >= 300 && log.status < 500;
                                if (logFilter === 'errors') return log.status >= 500;
                                return true;
                            });

                        const getStatusColor = (status: number) => {
                            if (status >= 500) return '#ef4444';
                            if (status >= 400) return '#f59e0b';
                            if (status >= 300) return '#3b82f6';
                            return '#22c55e';
                        };

                        const getStatusIcon = (status: number) => {
                            if (status >= 500) return '🔴';
                            if (status >= 400) return '🟠';
                            if (status >= 300) return '🔵';
                            return '🟢';
                        };

                        return (
                            <>
                                <div className="page-header">
                                    <h2 className="page-title">Server Logs</h2>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn" onClick={loadStats}>🔄 Refresh</button>
                                    </div>
                                </div>

                                {/* Filter Buttons */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    {[
                                        { key: 'all', label: '📋 All', color: undefined },
                                        { key: 'success', label: '🟢 Success', color: '#22c55e' },
                                        { key: 'warnings', label: '🟠 Warnings', color: '#f59e0b' },
                                        { key: 'errors', label: '🔴 Errors', color: '#ef4444' },
                                    ].map(({ key, label, color }) => (
                                        <button
                                            key={key}
                                            onClick={() => setLogFilter(key as typeof logFilter)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                border: '1px solid',
                                                borderColor: logFilter === key ? (color || 'var(--accent-primary)') : 'var(--border-subtle)',
                                                background: logFilter === key ? (color ? `${color}22` : 'rgba(139, 92, 246, 0.2)') : 'transparent',
                                                color: logFilter === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                    <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: '0.8rem', alignSelf: 'center' }}>
                                        {parsedLogs.length} entries
                                    </span>
                                </div>

                                <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                                    {parsedLogs.length > 0 ? (
                                        <table className="channels-table" style={{ margin: 0 }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '70px' }}>Time</th>
                                                    <th style={{ width: '120px' }}>IP</th>
                                                    <th>Path</th>
                                                    <th style={{ width: '80px' }}>Status</th>
                                                    <th style={{ width: '80px' }}>Agent</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedLogs.map((log, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                            {log.time}
                                                        </td>
                                                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>
                                                            {log.ip}
                                                        </td>
                                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: log.method === 'GET' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                                color: log.method === 'GET' ? '#22c55e' : '#3b82f6',
                                                                fontSize: '0.7rem',
                                                                marginRight: '8px'
                                                            }}>
                                                                {log.method}
                                                            </span>
                                                            {log.path}
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                color: getStatusColor(log.status)
                                                            }}>
                                                                {getStatusIcon(log.status)} {log.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                            {log.agent}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                                            {logs.length === 0 ? 'No logs available yet.' : 'No matching entries.'}
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </main >
            </div >
        </>
    );
}
