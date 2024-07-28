import { NextResponse } from "next/server";
import crypto from "crypto";

function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function encryptEntitySecret(entitySecret, publicKey) {
    const buffer = Buffer.from(entitySecret, "hex");
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        buffer
    );
    return encrypted.toString("base64");
}

export async function POST(request) {
    try {
        const { walletId, amount, recipient } = await request.json();

        if (!walletId || !amount || !recipient) {
            throw new Error("walletId, amount, and recipient are required");
        }

        const entitySecret = process.env.ENTITY_SECRET;
        if (!entitySecret) {
            throw new Error("ENTITY_SECRET is not set in environment variables");
        }

        // Fetch public key
        const publicKeyResponse = await fetch(
            "https://api.circle.com/v1/w3s/config/entity/publicKey",
            {
                headers: {
                    Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
                },
            }
        );
        const publicKeyData = await publicKeyResponse.json();
        const publicKey = publicKeyData.data.publicKey;

        const entitySecretCiphertext = encryptEntitySecret(entitySecret, publicKey);

        // Fetch wallet balance to get tokenId
        const balanceResponse = await fetch(
            `https://api.circle.com/v1/w3s/wallets/${walletId}/balances`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
                },
            }
        );

        const balanceData = await balanceResponse.json();
        console.log("Wallet balance data:", JSON.stringify(balanceData, null, 2));

        const usdcToken = balanceData.data.tokenBalances.find(
            (token) => token.token.symbol === "USDC" && token.token.blockchain === "MATIC-AMOY"
        );

        if (!usdcToken) {
            throw new Error("USDC token not found in wallet");
        }

        const tokenId = usdcToken.token.id;

        const response = await fetch(
            "https://api.circle.com/v1/w3s/developer/transactions/transfer",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
                },
                body: JSON.stringify({
                    walletId: walletId,
                    tokenId: tokenId,
                    amounts: [amount],
                    destinationAddress: recipient,
                    feeLevel: "MEDIUM",
                    idempotencyKey: generateUUID(),
                    entitySecretCiphertext: entitySecretCiphertext,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Circle API Error:", data);
            throw new Error(data.message || "Transfer failed");
        }

        return NextResponse.json({ success: true, data: data.data });
    } catch (error) {
        console.error("Error in transfer_usdc:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
