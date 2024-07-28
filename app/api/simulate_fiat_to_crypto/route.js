import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const amount = searchParams.get("amount");

        if (!amount) {
            throw new Error("Amount is required");
        }

        const exchangeRate = 0.3;
        const cryptoAmount = parseFloat(amount) * exchangeRate;

        return NextResponse.json({ data: { cryptoAmount: cryptoAmount.toFixed(2) } });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
