import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Store for rate limiting (in production, use Redis or similar)
const loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY = 4 * 60 * 60 * 1000; // 4 hours

// Active sessions storage (in production, use Redis)
const activeSessions: Map<string, { ip: string; expiry: number }> = new Map();

// Generate secure session token
function generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

// Hash password for comparison
function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

// Get client IP
function getClientIP(request: NextRequest): string {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
}

// Check rate limiting
function isRateLimited(ip: string): { limited: boolean; remainingTime?: number } {
    const attempt = loginAttempts.get(ip);
    if (!attempt) return { limited: false };

    const timePassed = Date.now() - attempt.lastAttempt;

    // Reset after lockout period
    if (timePassed > LOCKOUT_TIME) {
        loginAttempts.delete(ip);
        return { limited: false };
    }

    if (attempt.count >= MAX_ATTEMPTS) {
        return {
            limited: true,
            remainingTime: Math.ceil((LOCKOUT_TIME - timePassed) / 1000 / 60)
        };
    }

    return { limited: false };
}

// Record login attempt
function recordAttempt(ip: string): void {
    const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempt.count += 1;
    attempt.lastAttempt = Date.now();
    loginAttempts.set(ip, attempt);
}

// Clear attempts on successful login
function clearAttempts(ip: string): void {
    loginAttempts.delete(ip);
}

// POST: Login
export async function POST(request: NextRequest) {
    const ip = getClientIP(request);

    // Check rate limiting
    const rateLimit = isRateLimited(ip);
    if (rateLimit.limited) {
        return NextResponse.json({
            success: false,
            error: `Too many attempts. Try again in ${rateLimit.remainingTime} minutes.`,
        }, { status: 429 });
    }

    try {
        const { password } = await request.json();

        // Get admin password from environment
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error("ADMIN_PASSWORD not set in environment");
            return NextResponse.json({
                success: false,
                error: "Server configuration error",
            }, { status: 500 });
        }

        // Validate password
        if (password !== adminPassword) {
            recordAttempt(ip);
            const remaining = MAX_ATTEMPTS - (loginAttempts.get(ip)?.count || 0);
            return NextResponse.json({
                success: false,
                error: `Invalid password. ${remaining} attempts remaining.`,
            }, { status: 401 });
        }

        // Successful login
        clearAttempts(ip);

        // Generate session token
        const sessionToken = generateSessionToken();
        const expiry = Date.now() + SESSION_EXPIRY;

        // Store session
        activeSessions.set(sessionToken, { ip, expiry });

        // Clean old sessions
        for (const [token, session] of activeSessions) {
            if (session.expiry < Date.now()) {
                activeSessions.delete(token);
            }
        }

        return NextResponse.json({
            success: true,
            token: sessionToken,
            expiresIn: SESSION_EXPIRY,
        });

    } catch {
        return NextResponse.json({
            success: false,
            error: "Invalid request",
        }, { status: 400 });
    }
}

// GET: Validate session
export async function GET(request: NextRequest) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const ip = getClientIP(request);

    if (!token) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    const session = activeSessions.get(token);

    if (!session) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Check expiry
    if (session.expiry < Date.now()) {
        activeSessions.delete(token);
        return NextResponse.json({ valid: false, error: "Session expired" }, { status: 401 });
    }

    // Optional: Validate IP matches (stricter security)
    // if (session.ip !== ip) {
    //     return NextResponse.json({ valid: false, error: "IP mismatch" }, { status: 401 });
    // }

    return NextResponse.json({ valid: true });
}

// DELETE: Logout
export async function DELETE(request: NextRequest) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (token) {
        activeSessions.delete(token);
    }

    return NextResponse.json({ success: true });
}
