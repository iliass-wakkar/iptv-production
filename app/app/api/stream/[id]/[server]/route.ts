import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Channel data cache
let channelsCache: Record<string, any> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000;

function loadChannels(): Record<string, any> {
    const now = Date.now();
    if (channelsCache && now - cacheTime < CACHE_TTL) {
        return channelsCache;
    }

    try {
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
        return {};
    } catch {
        return {};
    }
}

// Helper to add CORS headers
function corsHeaders(): HeadersInit {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type",
        "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Type",
    };
}

// Proxy the stream content (not redirect)
async function proxyStream(url: string, request: NextRequest): Promise<Response> {
    try {
        // Forward the request to the actual stream URL
        const headers: HeadersInit = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "*/*",
        };

        // Forward Range header if present (for seeking)
        const range = request.headers.get("Range");
        if (range) {
            headers["Range"] = range;
        }

        const response = await fetch(url, {
            method: request.method,
            headers,
            redirect: "follow", // Follow redirects automatically
        });

        // Create response with CORS headers
        const responseHeaders = new Headers(corsHeaders());

        // Copy important headers from upstream
        const contentType = response.headers.get("Content-Type");
        if (contentType) {
            responseHeaders.set("Content-Type", contentType);
        }

        const contentLength = response.headers.get("Content-Length");
        if (contentLength) {
            responseHeaders.set("Content-Length", contentLength);
        }

        const contentRange = response.headers.get("Content-Range");
        if (contentRange) {
            responseHeaders.set("Content-Range", contentRange);
        }

        // Stream the response body
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: "Stream proxy failed" },
            { status: 502, headers: corsHeaders() }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; server: string }> }
) {
    const { id: channelId, server: serverIdx } = await params;
    const serverIndex = parseInt(serverIdx || "0", 10);

    // Load channels
    const channels = loadChannels();
    const channel = channels[channelId];

    if (!channel) {
        return NextResponse.json(
            { error: "Channel not found" },
            { status: 404, headers: corsHeaders() }
        );
    }

    // Get stream URL
    const servers = channel.servers || [];
    if (servers.length === 0) {
        return NextResponse.json(
            { error: "No stream available" },
            { status: 404, headers: corsHeaders() }
        );
    }

    const idx = Math.min(serverIndex, servers.length - 1);
    const streamUrl = servers[idx];

    console.log(`[STREAM PROXY] ${channelId} -> ${streamUrl}`);

    // Proxy the stream content
    return proxyStream(streamUrl, request);
}

// Handle HEAD requests (for format detection)
export async function HEAD(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; server: string }> }
) {
    return GET(request, { params });
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
}
