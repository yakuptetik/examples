import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            throw new Error("User ID is required");
        }
        const response = await fetch("https://api.circle.com/v1/w3s/users/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
            },
            body: JSON.stringify({ userId }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to acquire session token");
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in acquire_session_token:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
