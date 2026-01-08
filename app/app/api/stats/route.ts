import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Stats storage file
const STATS_FILE = path.join(process.cwd(), "data", "stats.json");

interface ActiveSession {
    channelId: string;
    lastSeen: number;
}

interface Stats {
    totalBytes: number;
    totalViews: number;
    hourlyStats: Record<string, { bytes: number; views: number }>;
    channelStats: Record<string, { bytes: number; views: number }>;
    activeSessions: Record<string, ActiveSession>; // sessionId -> session data
}

function loadStats(): Stats {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = fs.readFileSync(STATS_FILE, "utf-8");
            const parsed = JSON.parse(data);
            // Ensure activeSessions exists
            if (!parsed.activeSessions) {
                parsed.activeSessions = {};
            }
            return parsed;
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
    return {
        totalBytes: 0,
        totalViews: 0,
        hourlyStats: {},
        channelStats: {},
        activeSessions: {},
    };
}

function saveStats(stats: Stats): void {
    try {
        const dir = path.dirname(STATS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error("Failed to save stats:", error);
    }
}

// Clean up stale sessions (older than 45 seconds)
function cleanupStaleSessions(stats: Stats): number {
    const now = Date.now();
    const staleThreshold = 45000; // 45 seconds
    let activeCount = 0;

    for (const [sessionId, session] of Object.entries(stats.activeSessions)) {
        if (now - session.lastSeen > staleThreshold) {
            delete stats.activeSessions[sessionId];
        } else {
            activeCount++;
        }
    }

    return activeCount;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { channel_id, bytes, timestamp, session_id, type } = body;

        // Load current stats
        const stats = loadStats();

        // Handle heartbeat (for active viewers)
        if (type === "heartbeat" && session_id && channel_id) {
            // Check if this is a NEW session (first heartbeat = new view)
            const isNewSession = !stats.activeSessions[session_id];

            stats.activeSessions[session_id] = {
                channelId: channel_id,
                lastSeen: Date.now(),
            };

            // Count as a view on first heartbeat
            if (isNewSession) {
                stats.totalViews += 1;

                // Track channel stats
                if (!stats.channelStats[channel_id]) {
                    stats.channelStats[channel_id] = { bytes: 0, views: 0 };
                }
                stats.channelStats[channel_id].views += 1;

                // Update hourly stats
                const hour = new Date().toISOString().substring(0, 13);
                if (!stats.hourlyStats[hour]) {
                    stats.hourlyStats[hour] = { bytes: 0, views: 0 };
                }
                stats.hourlyStats[hour].views += 1;
            }

            saveStats(stats);
            return NextResponse.json({ ok: true });
        }

        // Handle session end
        if (type === "end" && session_id) {
            delete stats.activeSessions[session_id];
            saveStats(stats);
            return NextResponse.json({ ok: true });
        }

        // Handle bandwidth report
        if (!channel_id || typeof bytes !== "number") {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Update totals
        stats.totalBytes += bytes;
        stats.totalViews += 1;

        // Update hourly stats
        const hour = new Date(timestamp || Date.now()).toISOString().substring(0, 13);
        if (!stats.hourlyStats[hour]) {
            stats.hourlyStats[hour] = { bytes: 0, views: 0 };
        }
        stats.hourlyStats[hour].bytes += bytes;
        stats.hourlyStats[hour].views += 1;

        // Update channel stats
        if (!stats.channelStats[channel_id]) {
            stats.channelStats[channel_id] = { bytes: 0, views: 0 };
        }
        stats.channelStats[channel_id].bytes += bytes;
        stats.channelStats[channel_id].views += 1;

        // Update active session if session_id provided
        if (session_id) {
            stats.activeSessions[session_id] = {
                channelId: channel_id,
                lastSeen: Date.now(),
            };
        }

        // Keep only last 7 days of hourly stats
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffStr = cutoff.toISOString().substring(0, 13);
        for (const key of Object.keys(stats.hourlyStats)) {
            if (key < cutoffStr) {
                delete stats.hourlyStats[key];
            }
        }

        // Save stats
        saveStats(stats);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Stats POST error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// GET endpoint for admin dashboard
export async function GET() {
    const stats = loadStats();

    // Clean up stale sessions and get count
    const activeViewers = cleanupStaleSessions(stats);
    saveStats(stats); // Save after cleanup

    // Calculate daily bandwidth
    const today = new Date().toISOString().substring(0, 10);
    let todayBytes = 0;
    for (const [hour, data] of Object.entries(stats.hourlyStats)) {
        if (hour.startsWith(today)) {
            todayBytes += data.bytes;
        }
    }

    // Get active sessions per channel
    const activeByChannel: Record<string, number> = {};
    for (const session of Object.values(stats.activeSessions)) {
        activeByChannel[session.channelId] = (activeByChannel[session.channelId] || 0) + 1;
    }

    return NextResponse.json({
        totalBytes: stats.totalBytes,
        todayBytes,
        totalViews: stats.totalViews,
        activeViewers,
        activeByChannel,
        hourlyStats: stats.hourlyStats,
        topChannels: Object.entries(stats.channelStats)
            .sort((a, b) => b[1].views - a[1].views)
            .slice(0, 10),
    });
}
