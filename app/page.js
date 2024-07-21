"use client";
import { useState } from "react";
import "./globals.css";

export default function Home() {
    const [appId, setAppId] = useState("");
    const [userId, setUserId] = useState("");
    const [sessionToken, setSessionToken] = useState("");
    const [initializeResult, setInitializeResult] = useState("");

    const getAppId = async () => {
        const res = await fetch("/api/get_app_id");
        const data = await res.json();
        setAppId(data.data.appId);
    };

    const createUser = async () => {
        const res = await fetch("/api/create_a_new_user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "user_" + Date.now() }),
        });
        const data = await res.json();
        if (data.data && data.data.id) {
            setUserId(data.data.id);
        } else {
            console.error("Unexpected response format:", data);
        }
    };

    const getSessionToken = async () => {
        if (!userId) {
            console.error("User ID is not set. Please create a user first.");
            return;
        }
        const res = await fetch("/api/acquire_session_token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.data && data.data.userToken) {
            setSessionToken(data.data.userToken);
            console.log("Session token acquired successfully:", data.data.userToken);
        } else {
            console.error("Failed to acquire session token:", data);
        }
    };
    const initializeUser = async () => {
        if (!userId || !sessionToken) {
            console.error(
                "User ID or Session Token is missing. Please create a user and acquire a session token first."
            );
            return;
        }

        // TEST_API için "ETH-GOERLI", LIVE_API için "ETH" kullanın
        const blockchain = "MATIC-AMOY"; // veya "ETH" (API anahtarınıza bağlı olarak)

        console.log("Initializing user with:", {
            userId,
            blockchain,
            sessionToken: sessionToken.substring(0, 10) + "...",
        });

        const res = await fetch("/api/initialize_user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, blockchain, userToken: sessionToken }),
        });
        const data = await res.json();
        setInitializeResult(JSON.stringify(data, null, 2));
        if (data.error) {
            console.error("Failed to initialize user:", data.error);
        } else {
            console.log("User initialized successfully:", data);
        }
    };

    return (
        <main className="min-h-screen text-black p-8 bg-gray-100">
            <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
                User-Controlled Wallets
            </h1>

            <div className="grid grid-cols-1  md:grid-cols-2 h-full gap-6">
                <div className="bg-white p-6 rounded-lg h-full shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">1. Get App ID</h2>
                    <button
                        onClick={getAppId}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Get App ID
                    </button>
                    <p className="mt-4">
                        App ID: <div className="font-mono bg-gray-100 p-4 rounded ">{appId}</div>{" "}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg h-full shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">2. Create a New User</h2>
                    <button
                        onClick={createUser}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    >
                        Create User
                    </button>
                    <p className="mt-4">
                        User ID: <div className="font-mono bg-gray-100 p-4 rounded "> {userId}</div>
                    </p>
                </div>

                <div className="bg-white overflow-hidden p-6 w-full h-full rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">3. Acquire Session Token</h2>
                    <button
                        onClick={getSessionToken}
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                    >
                        Get Session Token
                    </button>
                    <div className="mt-4 h-full ">
                        Session Token:{" "}
                        <div className="font-mono bg-gray-100 p-4 rounded ">{sessionToken}</div>{" "}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg h-full shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">4. Initialize User</h2>
                    <button
                        onClick={initializeUser}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                        Initialize User
                    </button>
                    <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto">
                        {initializeResult}
                    </pre>
                </div>
            </div>
        </main>
    );
}
