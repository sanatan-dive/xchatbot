"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, collection, addDoc } from "@/lib/firebase";
import axios from "axios";

export default function Home() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);
    try {
      // Fetch user data from the Twitter API
      const response = await axios.get(`/api/twitter?username=${username}`);
      const { username: fetchedUsername, profile_image_url, followers_count, tweet_count } = response.data;
  
      // Save the fetched data to Firestore
      await addDoc(collection(db, "twitterUsernames"), {
        username: fetchedUsername.trim(),
        profileImageUrl: profile_image_url,
        followersCount: followers_count,
        tweetCount: tweet_count,
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
    <div className="min-h-screen flex flex-col justify-center items-center p-4  font-mono">
      <div className="w-full max-w-md bg-zinc-900 rounded-lg p-6 space-y-6 border border-zinc-800">
        <h1 className="text-2xl font-light text-zinc-200 text-center">
          Chat with 𝕏
        </h1>
        
        <p className="text-zinc-400 text-center text-sm">
          Enter a Twitter username to create your own ChatBot
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Twitter username"
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            {username && (
              <span className="absolute right-3 top-2 text-zinc-500">
                @{username}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full px-4 py-2 bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-t border-zinc-200 rounded-full animate-spin mx-auto" />
            ) : (
              "Create ChatBot"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}