"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import "./globals.css"
export default function Home() {
  const handleLogin = async (e: any) => {
    e.preventDefault();
    const res = await signIn("google", { callbackUrl: "/dashboard" });
    // console.log("t", res);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black flex-col">
      <div className="w-64 h-64 relative mr-4 left-8">
        <Image
          src="/images/tdlogo-01.png"
          alt="TD Logo"
          width={256}
          height={64}
        />
      </div>
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold">Makeups Portal</h1>
        <p className="text-lg">
          Managed By TimeTable Division, BITS Pilani Hyderabad Campus
        </p>
      </div>

      {/* Auth section */}
      <div className="flex flex-col space-y-4 items-center my-8">

        <button
          onClick={handleLogin}
          className="bg-green-500 w-1/4 hover:bg-green-600 text-white flex items-center justify-center mx-6 py-2 px-4 rounded-lg shadow-lg transition duration-300"
        >
          <Image
            src="/images/student.png"
            alt="Student"
            width={32}
            height={32}
            className="mr-2"
          />
          <h3 className="text-lg font-medium">Login with Google</h3>
        </button>
      </div>
    </div>
  );
}
