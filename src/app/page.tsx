"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, collection, addDoc } from "@/lib/firebase"; 

export default function Home() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      // Save the Twitter username to Firestore
      await addDoc(collection(db, "twitterUsernames"), {
        username: username.trim(),
        createdAt: new Date(),
      });

     

      setUsername(""); 
    } catch (error) {
      console.error("Error saving username:", error);
    } finally {
      setIsLoading(false);
      router.push(`/decision?username=${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-neutral-900 rounded-lg shadow-2xl p-8 w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-2">
          Chat with 𝕏
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Enter a Twitter username to create your own ChatBot
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Twitter username"
              className="w-full px-4 py-3 rounded-lg border border-stone-700 focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition duration-200 bg-neutral-800 text-gray-100 placeholder-gray-400"
            />
            {username && (
              <span className="absolute right-3 top-3 text-gray-500">
                @{username}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin" />
            ) : (
              "Create ChatBot"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
