import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'default-secret-change-me';

/**
 * Generate a signed token for stream access
 * @param ip Client IP address
 * @param channelId Channel ID
 * @param expirySeconds Duration in seconds (default 60s)
 */
export function generateStreamToken(ip: string, channelId: string, expirySeconds: number = 60): string {
    const expires = Math.floor(Date.now() / 1000) + expirySeconds;

    // Format: cloudflare:channel:expires:secret (IP removed for Cloudflare compatibility)
    const data = `cloudflare:${channelId}:${expires}:${TOKEN_SECRET}`;
    const signature = crypto.createHash('md5').update(data).digest('hex');

    // Final token: expires-signature
    return `${expires}-${signature}`;
}

export function validateStreamToken(token: string, ip: string, channelId: string): boolean {
    try {
        const [expiresStr, signature] = token.split('-');
        const expires = parseInt(expiresStr);

        // Check expiry
        if (Date.now() / 1000 > expires) return false;

        // Check signature (using cloudflare instead of IP)
        const data = `cloudflare:${channelId}:${expires}:${TOKEN_SECRET}`;
        const expectedSignature = crypto.createHash('md5').update(data).digest('hex');

        return signature === expectedSignature;
    } catch {
        return false;
    }
}
