import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = await request.json();
        const response = await fetch("https://api.circle.com/v1/w3s/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
            },
            body: JSON.stringify({ userId }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to create user");
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in create_a_new_user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
