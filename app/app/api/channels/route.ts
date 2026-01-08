import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Channel data cache
let channelsCache: Record<string, any> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

function loadChannels(): Record<string, any> {
    const now = Date.now();

    // Return cached if fresh
    if (channelsCache && now - cacheTime < CACHE_TTL) {
        return channelsCache;
    }

    try {
        // Try multiple possible locations for the channels file
        const possiblePaths = [
            path.join(process.cwd(), "data", "channels.json"),
            path.join(process.cwd(), "public", "channels.json"),
            path.join(process.cwd(), "..", "iptv-web-player", "data", "channels.json"),
        ];

        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, "utf-8");
                channelsCache = JSON.parse(data);
                cacheTime = now;
                return channelsCache!;
            }
        }

        // Fallback: return empty if no file found
        console.warn("No channels.json found in expected locations");
        return {};
    } catch (error) {
        console.error("Error loading channels:", error);
        return {};
    }
}

export async function GET() {
    const channels = loadChannels();
    return NextResponse.json(channels);
}
