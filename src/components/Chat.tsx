"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, collection, query, where, getDocs } from "@/lib/firebase";
import picture from "../../public/profile.png";
import Image from "next/image";

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
  } 
  
  catch (error) {
    console.error("Error fetching bot response:", error);
    return "Sorry, there was an error.";
  }
};

interface ChatProps {
  username: string;
}

function Chat({ username }: ChatProps) {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset messages when username changes
  useEffect(() => {
    setMessages([]); 
    setMessage(""); 
  }, [username]);

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
        }
      
        catch (error) {
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
      // Add the user's message
      setMessages((prevMessages) => [...prevMessages, message]);
      setMessage("");
  
      // Add a loading message for the bot's response
      setMessages((prevMessages) => [...prevMessages, "Loading..."]);
  
      try {
        // Fetch the bot's response
        const botReply = await fetchBotResponse(message, username);
  
        // Replace the loading message with the actual bot response
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = botReply; // Replace the last message
          return newMessages;
        });
      } 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      catch (error) {
        // Replace the loading message with an error message if something goes wrong
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = "Sorry, there was an error.";
          return newMessages;
        });
      }
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-2xl bg-black rounded-lg p-6 space-y-10 border border-stone-700">
        <h1 className="text-3xl font-light text-stone-200 text-center">
          {userProfile ? `@${userProfile.username}` : "Loading..."}
        </h1>

        {userProfile && (
          <div className="flex items-center gap-4 p-3 bg-stone-950 rounded border border-stone-700">
            <Image
              src={userProfile.profileImageUrl || "/api/placeholder/64/64"}
              alt={userProfile.username}
              width={64}
              height={64}
              className="w-12 h-12 rounded-full border border-stone-600"
            />
            <div className="text-lg text-stone-300 font-light">
              {userProfile.username}
            </div>
          </div>
        )}

<div className="h-[450px] overflow-auto bg-stone-950 p-4 rounded border border-stone-700 space-y-3">
  {messages.map((msg, idx) => (
    <div
      key={idx}
      className={`flex ${
        idx % 2 === 0 ? "justify-end" : "justify-start"
      } space-x-2`}
    >
      {idx % 2 !== 0 && userProfile && ( // Bot message
        <Image
          src={userProfile.profileImageUrl || "/api/placeholder/40/40"}
          alt={userProfile.username}
          width={40}
          height={40}
          className="w-8 h-8 rounded-full self-end"
        />
      )}
      <div
        className={`max-w-md mt-2 p-3 rounded-3xl ${
          idx % 2 === 0
            ? "bg-blue-500 text-white"
            : "bg-stone-700 text-white"
        }`}
      >
        {msg}
      </div>
      {idx % 2 === 0 && ( // User message
        <Image
          src={picture.src}  
          alt="User Avatar"
          width={40}
          height={40}
          className="w-8 h-8 rounded-full self-end"
        />
      )}
    </div>
  ))}
  <div ref={messagesEndRef} />
</div>


        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3 p-2 bg-stone-800 rounded-lg border border-stone-700"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Start a new message"
            className="flex-1 bg-transparent text-stone-200 placeholder-stone-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 text-blue-400 hover:text-blue-300 disabled:text-stone-600 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z"
              />
            </svg>
          </button>
        </form>

        <button
          onClick={() => router.push("/profiles")}
          className="w-full py-2 bg-stone-800 text-stone-200 rounded hover:bg-stone-700 border border-stone-600"
        >
          Explore Profiles
        </button>
      </div>
    </div>
  );
}

export default Chat;