export async function getClickHash(userId: number | string, lastClickSeconds: number) {
    const dataCheckString = `${userId}:${lastClickSeconds}`;
    const secretKey = 'click-secret';

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secretKey),
        {name: "HMAC", hash: "SHA-256"},
        false,
        ["sign", "verify"],
    );

    const signature = await crypto.subtle.sign(
        {name: "HMAC"},
        key,
        new TextEncoder().encode(dataCheckString)
    );

    return Buffer.from(signature).toString('hex');
}
