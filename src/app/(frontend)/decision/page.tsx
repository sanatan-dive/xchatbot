"use client";

import Image from "next/image";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, collection, query, where, getDocs } from "@/lib/firebase";
import { motion } from "framer-motion";
import profile from "../../../../public/profile.png";

// Separate component for the content that needs searchParams
const DecisionContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAlsoLoading, setIsAlsoLoading] = useState<boolean>(false);

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
    setIsAlsoLoading(true);
    router.push(`/profiles`);
  };

  const goToChat = () => {
    setIsLoading(true);
    if (username && userProfile) {
      router.push(`/chat?username=${username}`);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl bg-gradient-to-b from-stone-950 to-stone-900 rounded-lg p-6 space-y-8 shadow-lg border border-stone-800"
      >
        {/* Profile and Chat Section */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="flex sm:flex-row flex-col items-center gap-6 w-full">
            {/* Profile Section */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="rounded-full overflow-hidden border-2 shadow-btn shadow-neutral-500 border-stone-700 shadow-md">
                  {userProfile ? (
                    <Image
                      src={userProfile.profileImageUrl}
                      alt={userProfile.username}
                      width={80}
                      height={80}
                      className="hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-stone-700 rounded-full flex items-center justify-center">
                      <span className="text-stone-400">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Button Section */}
            <div className="flex-1 flex justify-center">
              <motion.button
                onClick={goToChat}
                aria-label="Talk to Yourself"
                disabled={!userProfile}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-md drop-shadow-xl hover:bg-stone-600 ${
                  !userProfile ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
               {isLoading ? (
                <div className="w-5 h-5 border-t-2 border-stone-400 rounded-full animate-spin mx-auto" />
              ) : (
                `Chat with ${userProfile ? userProfile.username : "Loading..."}`
              )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="w-full h-px bg-stone-700" />

        {/* Explore Others Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="flex sm:flex-row flex-col items-center gap-6 w-full">
            {/* Profile Section */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="rounded-full overflow-hidden border-2 shadow-btn shadow-neutral-500 border-stone-700 shadow-md">
                  <Image
                    src={profile}
                    alt="Other Profile"
                    width={80}
                    height={80}
                    className="hover:scale-110 transition-transform"
                  />
                </div>
              </div>
            </div>

            {/* Button Section */}
            <div className="flex-1 flex justify-center">
              <motion.button
                aria-label="Explore Profiles"
                onClick={toOther}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-md shadow hover:bg-stone-600 drop-shadow-xl"
              >
                  {isAlsoLoading ? (
                <div className="w-5 h-5 border-t-2 border-stone-400 rounded-full animate-spin mx-auto" />
              ) : (
                `Explore Profiles`
              )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex justify-center items-center text-white">
    <div className="text-xl">Loading...</div>
  </div>
);

// Main component with Suspense boundary
const Decision: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DecisionContent />
    </Suspense>
  );
};

export default Decision;