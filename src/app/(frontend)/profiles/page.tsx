"use client";

import React, { useState } from "react";
import Chat from "@/components/Chat";
import Profiles from "@/components/Profiles";
import { motion, AnimatePresence } from "framer-motion";

function Message() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleProfileClick = (username: string) => {
    setSelectedUser(username);
    setIsChatVisible(true);
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full flex  justify-center">
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full max-w-4xl relative">
        {/* Profiles Section */}
        <motion.div
          className={`absolute top-0 left-0 h-full w-full` }
          initial={{ x: 0 }}
          animate={{ x: isChatVisible ? "-50%" : "0%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Profiles onProfileClick={handleProfileClick} />
        </motion.div>

        {/* Chat Section */}
        <AnimatePresence>
          {isChatVisible && (
            <motion.div
              className="absolute top-0 right-0 h-full max-w-4xl w-full"
              initial={{ x: "1000px" }}
              animate={{ x: "500px" }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {selectedUser && <Chat username={selectedUser} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="md:hidden w-full flex flex-col">
        {/* Chat Section */}
        <AnimatePresence>
          {isChatVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {selectedUser && <Chat username={selectedUser} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profiles Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full mt-4"
        >
          <Profiles onProfileClick={handleProfileClick} />
        </motion.div>
      </div>
    </div>
  );
}

export default Message;
