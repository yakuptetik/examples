import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
    try {
        const { userId, blockchain, userToken } = await request.json();
        if (!userId || !blockchain || !userToken) {
            throw new Error("userId, blockchain, and userToken are required");
        }

        const idempotencyKey = crypto.randomUUID();

        console.log("Initializing user with:", {
            userId,
            blockchain,
            userToken: userToken.substring(0, 10) + "...",
        });

        const response = await fetch("https://api.circle.com/v1/w3s/user/initialize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
                "X-User-Token": userToken,
            },
            body: JSON.stringify({
                userId,
                idempotencyKey,
                blockchains: [blockchain],
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("API Error:", data);
            throw new Error(data.message || "Failed to initialize user");
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in initialize_user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
