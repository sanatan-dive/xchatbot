"use client";

import React, { useState } from 'react';
import Chat from '@/components/Chat';
import Profiles from '@/components/Profiles';
import { motion, AnimatePresence } from "framer-motion";

function Message() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleProfileClick = (username: string) => {
    setSelectedUser(username);
    setIsChatVisible(true);
  };

  return (
    <div className="min-h-screen w-full">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-2 w-full">
        <div className="col-span-1">
          <Profiles onProfileClick={handleProfileClick} />
        </div>
        <AnimatePresence>
          {isChatVisible && (
            <motion.div
              className="col-span-1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
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

        {/* Profiles Section - Always visible */}
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