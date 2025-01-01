"use client";

import React, { useEffect, useState } from "react";
import { db, collection, getDocs } from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Define TypeScript interfaces
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
  createdAt: any; // Firebase Timestamp
}

function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const router = useRouter();

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

  return (
    <div className="min-h-screen flex flex-col items-center p-4  font-mono">
      <div className="w-full max-w-4xl bg-zinc-900 rounded-lg p-6 space-y-6 border border-zinc-800">
        <h1 className="text-2xl font-light text-zinc-200 text-center">
          User Profiles
        </h1>

        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by username"
          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="p-4 bg-zinc-800 rounded border border-zinc-700 space-y-4"
            >
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full mx-auto border border-zinc-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto bg-zinc-700 flex items-center justify-center border border-zinc-600">
                  <span className="text-2xl text-zinc-400">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <h2 className="text-lg font-light text-center text-zinc-200">
                @{profile.username}
              </h2>
              
              {(profile.followersCount !== undefined || profile.tweetCount !== undefined) && (
                <div>
                <p className="text-center text-sm text-zinc-400">
                  {profile.followersCount !== undefined && `Followers: ${profile.followersCount}`}
                  {profile.followersCount !== undefined && profile.tweetCount !== undefined && " | "}
                  {profile.tweetCount !== undefined && `Tweets: ${profile.tweetCount}`}
                </p>
                <button className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 hover:bg-zinc-700 focus:outline-none focus:border-zinc-600 mt-2 "
                onClick={() => router.push(`/chat?username=${profile.username}`)}>
                  <p className="text-center  text-sm text-zinc-400">
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
  );
}

export default Profiles;