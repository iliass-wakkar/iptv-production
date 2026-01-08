import { NextRequest, NextResponse } from "next/server";
import { generateStreamToken } from "@/lib/token";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        // Get client IP
        // In Docker, X-Forwarded-For is set by NGINX
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : "127.0.0.1";

        // Generate signed token
        // Short expiry (30s) because it's used immediately
        const token = generateStreamToken(ip, id, 30);

        return NextResponse.json({
            token,
            url: `/stream/${id}?token=${token}`
        });

    } catch (error) {
        console.error("Token generation failed:", error);
        return NextResponse.json(
            { error: "Failed to generate token" },
            { status: 500 }
        );
    }
}
