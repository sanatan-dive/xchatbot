"use client"
import React, { useState } from 'react'
import Chat from '@/components/Chat'
import Profiles from '@/components/Profiles'
import {motion} from "framer-motion"

function Message() {
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleProfileClick = (username:string) => {
    setSelectedUser(username);
    console.log(selectedUser)
  
    setIsChatVisible(true)
  }

  return (
    <div className="grid grid-cols-2">
      <div className="col-span-1">
        <Profiles onProfileClick={handleProfileClick} />
      </div>
      
      <motion.div
  className={`col-span-1 ${isChatVisible ? "block" : "hidden"}`}
  initial={{ opacity: 0, x: 700 }}
  animate={{ opacity: 1,x: 0 }}
  transition={{ duration: 1 , delay: 0.5, ease: "easeInOut" }}
  
>
  {selectedUser && <Chat username={selectedUser} />}
</motion.div>
    </div>
  )
}


export default Message
