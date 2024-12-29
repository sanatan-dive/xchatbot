"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/grok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: `Analyze Twitter user: ${username}` }),
      });

      console.log(response);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-2">
          Twitter Analysis
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Enter a Twitter username to analyze their profile
        </p>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Twitter username"
              className="w-full px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200 bg-gray-700 text-gray-100 placeholder-gray-400"
            />
            {username && (
              <span className="absolute right-3 top-3 text-gray-500">
                @{username}
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !username.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin" />
            ) : (
              "Analyze Profile"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
