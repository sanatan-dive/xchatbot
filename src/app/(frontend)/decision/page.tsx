"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, collection, query, where, getDocs } from "@/lib/firebase";
import profile from "../../../../public/profile.png";

const Decision: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

 const [userProfile, setUserProfile] = useState<any>(null);

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

  const toOther = () => {
    router.push(`/profiles`);
  };

  const goToChat = () => {
    if (username && userProfile) {
      router.push(`/chat?username=${username}`);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-4 font-mono">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-lg p-6 space-y-8 border border-zinc-800">
        {/* Profile and Chat Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex sm:flex-row flex-col items-center gap-6 w-full">
            {/* Profile Section */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="rounded-full overflow-hidden border border-zinc-700">
                  {userProfile ? (
                    <Image
                      src={userProfile.profileImageUrl}
                      alt={userProfile.username}
                      width={80}
                      height={80}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-zinc-700 rounded-full flex items-center justify-center">
                      <span className="text-zinc-200">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Button Section */}
            <div className="flex-1 flex justify-center">
              <button
                onClick={goToChat}
                aria-label="Talk to Yourself"
                disabled={!userProfile}
                className={`w-full sm:w-auto px-6 py-2 bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 border border-zinc-700 ${
                  !userProfile ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Chat with {userProfile ? userProfile.username : "Loading..."}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-zinc-800" />

        {/* Explore Others Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex sm:flex-row flex-col items-center gap-6 w-full">
            {/* Profile Section */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="rounded-full overflow-hidden border border-zinc-700">
                  <Image
                    src={profile}
                    alt="Other Profile"
                    width={80}
                    height={80}
                    className="hover:opacity-80 transition-opacity"
                  />
                </div>
              </div>
            </div>

            {/* Button Section */}
            <div className="flex-1 flex justify-center">
              <button
                aria-label="Explore Profiles"
                onClick={toOther}
                className="w-full sm:w-auto px-6 py-2 bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 border border-zinc-700"
              >
                Explore Profiles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Decision;
