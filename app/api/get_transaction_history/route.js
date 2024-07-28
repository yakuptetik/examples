import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletId = searchParams.get("walletId");

        if (!walletId) {
            throw new Error("Wallet ID is required");
        }

        console.log("Fetching transaction history for wallet:", walletId);

        const response = await fetch(
            `https://api.circle.com/v1/w3s/wallets/${walletId}/transactions?pageSize=10`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
                },
            }
        );

        const data = await response.json();

        console.log("Transaction history API response:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            throw new Error(data.message || "Failed to get transaction history");
        }

        if (!data.data || !data.data.transactions) {
            throw new Error("Unexpected response format from Circle API");
        }

        const transactions = data.data.transactions.map((tx) => ({
            amount: tx.amount.amount,
            recipient: tx.destinationAddress,
            status: tx.status,
            timestamp: tx.createDate,
        }));

        return NextResponse.json({ data: { transactions } });
    } catch (error) {
        console.error("Error in get_transaction_history:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
