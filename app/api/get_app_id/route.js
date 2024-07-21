import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://api.circle.com/v1/w3s/config/entity", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
