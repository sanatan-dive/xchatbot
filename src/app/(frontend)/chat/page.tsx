"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, collection, query, where, getDocs } from "@/lib/firebase";

const fetchBotResponse = async (message: string, username: string | null) => {
  try {
    const response = await fetch("/api/grok", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, username }), // Send the user's message and username
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bot response");
    }

    const data = await response.json();

    return data.message || "Sorry, I couldn't understand that.";
  } catch (error) {
    console.error("Error fetching bot response:", error);
    return "Sorry, there was an error.";
  }
};

function Chat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (username) {
      const fetchUserProfile = async () => {
        try {
          const userQuery = query(
            collection(db, "twitterUsernames"),
            where("username", "==", username)
          );
          const querySnapshot = await getDocs(userQuery);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUserProfile(userData);
          } else {
            console.error("User not found in database.");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    }
  }, [username]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Send the user message
      setMessages((prevMessages) => [...prevMessages, message]);
      setMessage("");

      // Get the bot's reply from /api/grok, including the username
      const botReply = await fetchBotResponse(message, username);

      // Add bot's response to messages
      setMessages((prevMessages) => [...prevMessages, botReply]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg font-mono">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-lg p-6 space-y-6 border border-zinc-800">
        <h1 className="text-3xl font-light text-zinc-200 text-center">
          {userProfile ? `@${userProfile.username}` : "Loading..."}
        </h1>

        {userProfile && (
          <div className="flex items-center gap-4 p-3 bg-zinc-900 rounded border border-zinc-800">
            <img
              src={userProfile.profileImageUrl || "/api/placeholder/64/64"}
              alt={userProfile.username}
              className="w-12 h-12 rounded-full border border-zinc-700"
            />
            <div className="text-lg text-zinc-300 font-light">
              {userProfile.username}
            </div>
          </div>
        )}

        <div className="h-96 overflow-auto bg-zinc-900 p-4 rounded border border-zinc-800 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${idx % 2 === 0 ? "justify-end" : "justify-start"} space-x-3`}
            >
              <div
                className={`max-w-xs p-3 rounded ${
                  idx % 2 === 0
                    ? "bg-zinc-800 text-zinc-200"
                    : "bg-zinc-700 text-zinc-200"
                }`}
              >
                {msg}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-6 py-2 bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
          >
            Send
          </button>
        </form>

        <button
          onClick={() => router.push("/profiles")}
          className="w-full py-2 bg-neutral-800 text-zinc-200 rounded hover:bg-zinc-700 border border-zinc-700"
        >
          Explore Profiles
        </button>
      </div>
    </div>
  );
}

export default Chat;
