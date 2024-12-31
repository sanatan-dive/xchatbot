import Image from 'next/image';
import React from 'react';
import profile from '/public/profile.png';

const Decision = () => {
  return (
    <div className="min-h-screen flex justify-center items-center text-gray-100 p-4">
      <div className="bg-neutral-800/50 backdrop-blur-sm max-w-2xl w-full rounded-2xl shadow-2xl border border-neutral-700/30 flex flex-col gap-12 p-8 transition-all duration-300 hover:shadow-neutral-700/20">
        {/* Profile and Talk to Yourself Section */}
        <div className="flex flex-col sm:flex-row items-center gap-8">
  <div className="flex sm:flex-row flex-col items-center gap-6 w-full">
    {/* Profile Section */}
    <div className="flex-1 flex justify-center">
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 group-hover:opacity-100 transition duration-300"></div>
        <div className="relative rounded-full overflow-hidden">
          <Image
            src={profile}
            alt="Your Profile"
            width={100}
            height={100}
            className="transform transition duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    </div>

    {/* Button Section */}
    <div className="flex-1 flex justify-center">
      <button
        aria-label="Talk to Yourself"
        className="w-full sm:w-auto bg-gradient-to-r from-stone-700 to-stone-600 hover:from-stone-600 hover:to-stone-500 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        Talk to Yourself
      </button>
    </div>
  </div>
</div>


        {/* Talk to Others Section */}
        <div className="flex flex-col sm:flex-row items-center gap-8">
  <div className="flex sm:flex-row flex-col items-center gap-6 w-full">
    {/* Profile Section */}
    <div className="flex-1 flex justify-center">
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-green-500 to-teal-600 opacity-30 group-hover:opacity-100 transition duration-300"></div>
        <div className="relative rounded-full overflow-hidden">
          <Image
            src={profile}
            alt="Other Profile"
            width={100}
            height={100}
            className="transform transition duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    </div>

    {/* Button Section */}
    <div className="flex-1 flex justify-center">
      <button
        aria-label="Explore Profiles"
        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
