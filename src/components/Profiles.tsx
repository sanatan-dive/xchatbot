"use client";

import React, { useEffect, useState } from "react";
import { db, collection, getDocs } from "@/lib/firebase";
import Image from "next/image";

interface Profile {
  id: string;
  username: string;
  profileImageUrl?: string;
  followersCount?: number;
  tweetCount?: number;
  createdAt: Date;
}

interface ProfileDocData {
  username: string;
  profileImageUrl?: string;
  followersCount?: number;
  tweetCount?: number;
  createdAt: any;
}

interface ProfilesProps {
  onProfileClick: (username: string) => void;
}

function Profiles({ onProfileClick }: ProfilesProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "twitterUsernames"));
        const fetchedProfiles: Profile[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as ProfileDocData),
        }));
        setProfiles(fetchedProfiles);
        setFilteredProfiles(fetchedProfiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };
    fetchProfiles();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = profiles.filter((profile) =>
      profile.username.toLowerCase().includes(query)
    );
    setFilteredProfiles(filtered);
  };

  const handleProfileClick = (username: string) => {
    onProfileClick(username);
  }

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[866px] bg-gradient-to-b from-stone-950 to-stone-900 rounded-lg p-6 flex flex-col border border-stone-800">
        <h1 className="text-2xl font-light text-stone-200 text-center mb-4">User Profiles</h1>

        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by username"
          className="w-full px-4 py-2 bg-stone-800 border border-stone-700 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600 mb-4"
        />

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="p-4 bg-stone-800 rounded border border-stone-700 space-y-4"
              >
                {profile.profileImageUrl ? (
                  <Image
                    src={profile.profileImageUrl}
                    alt={profile.username}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full mx-auto border border-stone-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full mx-auto bg-stone-700 flex items-center justify-center border border-stone-600">
                    <span className="text-2xl text-stone-400">
                      {profile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <h2 className="text-lg font-light text-center text-stone-200">
                  @{profile.username}
                </h2>
                
                {(profile.followersCount !== undefined || profile.tweetCount !== undefined) && (
                  <div>
                    <p className="text-center text-sm text-stone-400">
                      {profile.followersCount !== undefined && `Followers: ${profile.followersCount}`}
                      {profile.followersCount !== undefined && profile.tweetCount !== undefined && " | "}
                      {profile.tweetCount !== undefined && `Tweets: ${profile.tweetCount}`}
                    </p>
                    <button
                      className="w-full px-4 py-2 bg-stone-800 border border-stone-700 rounded text-stone-200 hover:bg-stone-700 focus:outline-none focus:border-stone-600 mt-2"
                      onClick={() => handleProfileClick(profile.username)}  
                    >
                      <p className="text-center text-sm text-stone">
                        Chat with @{profile.username}
                      </p>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profiles;