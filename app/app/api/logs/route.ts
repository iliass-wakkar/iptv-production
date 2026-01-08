import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// This endpoint is called by the admin dashboard to fetch recent NGINX logs
// In Docker, NGINX logs are at /var/log/openresty/error.log
// We'll proxy this through NGINX since Next.js can't access IPTV container files directly

export async function GET() {
    try {
        // Fetch logs from NGINX container via internal API
        const res = await fetch("http://iptv:80/_internal/logs", {
            headers: { "X-Internal-Request": "true" },
        });

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
        }

        // Fallback: Return empty logs if internal API not available
        return NextResponse.json({
            logs: [],
            message: "Log endpoint not configured"
        });
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return NextResponse.json({
            logs: [],
            error: "Could not connect to log service"
        });
    }
}
