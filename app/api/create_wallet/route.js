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
        const { userId, sessionToken } = await request.json();

        if (!userId || !sessionToken) {
            throw new Error("userId and sessionToken are required");
        }

        const entitySecret = process.env.ENTITY_SECRET;
        if (!entitySecret) {
            throw new Error("ENTITY_SECRET is not set in environment variables");
        }

        const walletSetId = process.env.WALLET_SET_ID;
        if (!walletSetId) {
            throw new Error("WALLET_SET_ID is not set in environment variables");
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

        console.log("Sending request to Circle API with:", {
            userId,
            sessionToken: sessionToken.substring(0, 10) + "...",
        });

        const response = await fetch("https://api.circle.com/v1/w3s/developer/wallets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
                "X-User-Token": sessionToken,
            },
            body: JSON.stringify({
                userId: userId,
                walletSetId: walletSetId,
                blockchains: ["MATIC-AMOY"],
                entitySecretCiphertext: entitySecretCiphertext,
                idempotencyKey: generateUUID(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Circle API Error:", data);
            throw new Error(data.message || "Failed to create wallet");
        }

        console.log("Successful response from Circle API:", data);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in create_wallet:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
