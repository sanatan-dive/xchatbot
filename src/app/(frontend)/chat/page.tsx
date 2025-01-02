"use client";

import Chat from '@/components/Chat';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

// Separate component for content that uses searchParams
const ChatContent = () => {
  const searchParams = useSearchParams();
  const userName = searchParams.get("username") || "";
  
  return <Chat username={userName} />;
};

// Loading component
const LoadingChat = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Loading chat...</div>
    </div>
  );
};

// Main component with Suspense boundary
function ChatWithSuspense() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingChat />}>
        <ChatContent />
      </Suspense>
    </div>
  );
}

export default ChatWithSuspense;