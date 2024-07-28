"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./globals.css";

export default function Home() {
    const [email, setEmail] = useState("yakuptetik.16@gmail.com");
    const [password, setPassword] = useState("password");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();
    const [appId, setAppId] = useState("");
    const [userId, setUserId] = useState("");
    const [sessionToken, setSessionToken] = useState("");
    const [walletId, setWalletId] = useState("");
    const [walletBalance, setWalletBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [transferAmount, setTransferAmount] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [fiatAmount, setFiatAmount] = useState("");
    const [cryptoEquivalent, setCryptoEquivalent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const storedData = localStorage.getItem("walletData");
        const storedLoginStatus = localStorage.getItem("isLoggedIn");
        if (storedLoginStatus === "true") {
            setIsLoggedIn(true);
        }
        if (storedData) {
            const { appId, userId, sessionToken, walletId } = JSON.parse(storedData);
            setAppId(appId);
            setUserId(userId);
            setSessionToken(sessionToken);
            setWalletId(walletId);
            setIsInitialized(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        // Burada normalde bir API çağrısı yapılır, biz şimdilik basit bir kontrol yapacağız
        if (email === "yakuptetik.16@gmail.com" && password === "password") {
            setIsLoggedIn(true);
            // Gerçek uygulamada burada bir token saklanabilir
            localStorage.setItem("isLoggedIn", "true");
        } else {
            alert("Invalid email or password");
        }
    };

    useEffect(() => {
        if (isInitialized && walletId) {
            getWalletBalance();
            getTransactionHistory();
        }
    }, [isInitialized, walletId]);

    const getAppId = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/get_app_id");
            const data = await res.json();
            if (data.data && data.data.appId) {
                setAppId(data.data.appId);
                updateLocalStorage({ appId: data.data.appId });
            } else {
                throw new Error("Failed to get App ID");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createUser = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/create_a_new_user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: "user_" + Date.now() }),
            });
            const data = await res.json();
            if (data.data && data.data.id) {
                setUserId(data.data.id);
                updateLocalStorage({ userId: data.data.id });
            } else {
                throw new Error("Failed to create user");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getSessionToken = async () => {
        if (!userId) {
            setError("User ID is required to get session token");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/acquire_session_token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.data && data.data.userToken) {
                setSessionToken(data.data.userToken);
                updateLocalStorage({ sessionToken: data.data.userToken });
            } else {
                throw new Error("Failed to acquire session token");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createWallet = async () => {
        if (!userId || !sessionToken) {
            setError("User ID and Session Token are required to create a wallet");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/create_wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, sessionToken }),
            });
            const data = await res.json();

            console.log("API Response:", data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.data && data.data.wallets && data.data.wallets.length > 0) {
                const newWalletId = data.data.wallets[0].id;
                setWalletId(newWalletId);
                updateLocalStorage({ walletId: newWalletId });
                console.log("Wallet created successfully:", newWalletId);
                setIsInitialized(true);
            } else {
                throw new Error("Wallet ID not found in the response");
            }
        } catch (err) {
            console.error("Error creating wallet:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getWalletBalance = async () => {
        if (!walletId) {
            setError("Wallet ID is required to get balance");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/get_wallet_balance?walletId=${walletId}`);
            const data = await res.json();
            if (data.balance) {
                setWalletBalance(data.balance);
            } else {
                throw new Error("Failed to get wallet balance");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const transferUSDC = async () => {
        if (!walletId || !transferAmount || !recipientAddress) {
            setError("Wallet ID, transfer amount, and recipient address are required for transfer");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/transfer_usdc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletId,
                    amount: transferAmount,
                    recipient: recipientAddress,
                }),
            });
            const data = await res.json();
            console.log("Transfer response:", data);
            if (data.error) {
                throw new Error(data.error);
            }
            if (data.success) {
                alert("Transfer successful!");
                getWalletBalance();
                getTransactionHistory();
            } else {
                throw new Error("Unexpected response format");
            }
        } catch (err) {
            console.error("Error transferring USDC:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionHistory = async () => {
        if (!walletId) {
            setError("Wallet ID is required to get transaction history");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/get_transaction_history?walletId=${walletId}`);
            const data = await res.json();
            if (data.data && data.data.transactions) {
                setTransactions(data.data.transactions);
            } else {
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const simulateFiatToCrypto = async () => {
        if (!fiatAmount) {
            setError("Fiat amount is required for conversion");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/simulate_fiat_to_crypto?amount=${fiatAmount}`);
            const data = await res.json();
            if (data.data && data.data.cryptoAmount) {
                setCryptoEquivalent(data.data.cryptoAmount);
            } else {
                throw new Error("Failed to simulate fiat to crypto conversion");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateLocalStorage = (newData) => {
        const storedData = JSON.parse(localStorage.getItem("walletData") || "{}");
        const updatedData = { ...storedData, ...newData };
        localStorage.setItem("walletData", JSON.stringify(updatedData));
    };

    if (!isLoggedIn) {
        return (
            <div className="w-full flex flex-grow items-center justify-center flex-col-reverse lg:flex-row min-h-screen">
                <div className="w-full lg:w-1/2 bg-accent-purple-gradient flex items-center justify-center py-24 lg:h-screen px-6 flex-grow-1 flex-shrink-0 min-h-152">
                    <div className="max-w-lg px-4">
                        <div className="type-h-page-lg mb-8 text-4xl text-center sm:text-left">
                            Circle Wallet Management
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 bg-white flex items-center justify-center py-24 lg:h-screen px-6 flex-grow flex-shrink-0 min-h-152">
                    <div className="max-w-lg w-full">
                        <form onSubmit={handleLogin} className="w-full space-y-4">
                            <div className="cb-input">
                                <div className="label-container">
                                    <label className="label" htmlFor="email">
                                        Email
                                    </label>
                                </div>
                                <div className="field-container field-text">
                                    <div className="field-content text-gray-900">
                                        <input
                                            type="text"
                                            id="disabled-input"
                                            value={email}
                                            placeholder="Enter your email"
                                            onChange={(e) => setEmail(e.target.value)}
                                            aria-label="disabled input"
                                            class="mb-6  bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed "
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="cb-input">
                                <div className="label-container">
                                    <label className="label" htmlFor="password">
                                        Password
                                    </label>
                                </div>
                                <div className="field-container field-text">
                                    <div className="field-content">
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            aria-label="disabled input"
                                            placeholder="password"
                                            class="mb-6  bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed "
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="cb-button base primary bg-black py-2 rounded-full w-full"
                            >
                                <span>Login</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (!isInitialized) {
        return (
            <main className="min-h-screen text-black p-8 bg-gray-100">
                <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
                    Circle Wallet Management
                </h1>

                {error && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
                        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">1. Get App ID</h2>
                        <button
                            onClick={getAppId}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                            Get App ID
                        </button>
                        <p className="mt-4">App ID: {appId}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">2. Create a New User</h2>
                        <button
                            onClick={createUser}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                        >
                            Create User
                        </button>
                        <p className="mt-4">User ID: {userId}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">3. Acquire Session Token</h2>
                        <button
                            onClick={getSessionToken}
                            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                        >
                            Get Session Token
                        </button>
                        <p className="mt-4">
                            Session Token:{" "}
                            {sessionToken ? `${sessionToken.substring(0, 10)}...` : ""}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">4. Create Wallet</h2>
                        <button
                            onClick={createWallet}
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                        >
                            Create Wallet
                        </button>
                        <p className="mt-4">Wallet ID: {walletId}</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen text-black p-8 bg-gray-100">
            <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
                Circle Wallet Management
            </h1>

            {error && (
                <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {loading && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">5. Wallet Balance</h2>
                    <p className="text-xl">Balance: {walletBalance} USDC</p>
                    <button
                        onClick={getWalletBalance}
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Refresh Balance
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">6. Transfer USDC</h2>
                    <input
                        type="text"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full p-2 mb-2 border rounded"
                    />
                    <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="Recipient Address"
                        className="w-full p-2 mb-2 border rounded"
                    />
                    <button
                        onClick={transferUSDC}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    >
                        Transfer
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">7. Transaction History</h2>
                    <ul className="max-h-60 overflow-y-auto">
                        {transactions.map((tx, index) => (
                            <li key={index} className="mb-2 p-2 bg-gray-100 rounded">
                                {tx.amount} USDC to {tx.recipient}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">8. Fiat to Crypto Conversion</h2>
                    <input
                        type="text"
                        value={fiatAmount}
                        onChange={(e) => setFiatAmount(e.target.value)}
                        placeholder="Fiat Amount (USD)"
                        className="w-full p-2 mb-2 border rounded"
                    />
                    <button
                        onClick={simulateFiatToCrypto}
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                    >
                        Simulate Conversion
                    </button>
                    <p className="mt-2">Equivalent: {cryptoEquivalent} USDC</p>
                </div>
            </div>
        </main>
    );
}
