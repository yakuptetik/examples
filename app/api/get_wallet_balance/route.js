import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletId = searchParams.get("walletId");

        if (!walletId) {
            throw new Error("Wallet ID is required");
        }

        const response = await fetch(`https://api.circle.com/v1/w3s/wallets/${walletId}/balances`, {
            headers: {
                Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to get wallet balance");
        }

        console.log("Full wallet balance response:", JSON.stringify(data, null, 2));

        // USDC token'ını bul (MATIC-AMOY blockchain'inde)
        const usdcToken = data.data.tokenBalances.find(
            (token) => token.token.symbol === "USDC" && token.token.blockchain === "MATIC-AMOY"
        );

        if (!usdcToken) {
            return NextResponse.json({
                error: "USDC token not found in wallet",
                balances: data.data.tokenBalances,
            });
        }

        return NextResponse.json({
            balance: usdcToken.amount,
            tokenId: usdcToken.token.id,
            allBalances: data.data.tokenBalances,
        });
    } catch (error) {
        console.error("Error in get_wallet_balance:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
