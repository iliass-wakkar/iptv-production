import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// This is a PUBLIC endpoint - only returns top channel IDs, no sensitive data
export async function GET() {
    try {
        const dataPath = path.join(process.cwd(), "data", "stats.json");

        if (!fs.existsSync(dataPath)) {
            return NextResponse.json({ topChannels: [] });
        }

        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        const channelStats = data.channelStats || {};

        // Sort channels by views and return only IDs (no counts or other data)
        const topChannelIds = Object.entries(channelStats)
            .sort((a, b) => {
                const aViews = (a[1] as { views?: number }).views || 0;
                const bViews = (b[1] as { views?: number }).views || 0;
                return bViews - aViews;
            })
            .slice(0, 10)
            .map(([channelId]) => channelId);

        return NextResponse.json({ topChannels: topChannelIds });
    } catch {
        return NextResponse.json({ topChannels: [] });
    }
}
