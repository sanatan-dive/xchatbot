"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, collection, addDoc, query, where, getDocs } from "@/lib/firebase";
import axios from "axios";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { motion } from "framer-motion";

export default function Home() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);

    try {
      const usernameQuery = query(
        collection(db, "twitterUsernames"),
        where("username", "==", username.trim())
      );
      const querySnapshot = await getDocs(usernameQuery);

      if (!querySnapshot.empty) {
        console.log("Username already exists in the database.");
      } else {
        const response = await axios.get(`/api/twitter?username=${username}`);
        const { username: fetchedUsername, profile_image_url, followers_count, tweet_count } = response.data;

        await addDoc(collection(db, "twitterUsernames"), {
          username: fetchedUsername.trim(),
          profileImageUrl: profile_image_url,
          followersCount: followers_count,
          tweetCount: tweet_count,
          createdAt: new Date(),
        });

        console.log("Username added to the database.");
      }

      setUsername("");
    } catch (error) {
      console.error("Error processing username:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      router.push(`/decision?username=${encodeURIComponent(username.trim())}`);
    }
  };

  const handleProfileClick = () => {
    setIsProfileLoading(true);
    router.push("/profiles");
  };

  return (
    <div className="min-h-screen text-white">
      <div className="absolute top-4 mt-4 mr-4 right-4">
        <RainbowButton
          className="bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 text-sm py-4 px-8 rounded-lg shadow hover:scale-105 hover:shadow-lg transition-transform"
          onClick={handleProfileClick}
        >
          {isProfileLoading ? (
            <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mx-auto" />
          ) : (
            "Profiles"
          )}
        </RainbowButton>
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg bg-stone-900 rounded-xl p-8 shadow-lg border border-stone-800"
        >
          <h1 className="text-4xl font-bold text-center mb-4">Chat with 𝕏</h1>
          <p className="text-stone-400 text-center mb-6">
            Enter a Twitter username to create your own chatbot.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Twitter username"
                className="w-full px-4 py-3 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 placeholder-stone-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {username && (
                <span className="absolute right-3 top-3 text-stone-500">@{username}</span>
              )}
            </div>
            <motion.button
              aria-label="create chatbot"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-gradient-to-r from-stone-800 to-stone-700 text-white rounded-lg hover:from-stone-700 hover:to-stone-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-t-2 border-stone-400 rounded-full animate-spin mx-auto" />
              ) : (
                "Create ChatBot"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
