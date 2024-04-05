import React from 'react'
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar from '@/components/navbar';
const AccountSettings = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
  
    useEffect(() => {
      if (status === "unauthenticated") {
        router.replace("/");
      }
    }), [status, router]

  return (
    <div>
        <Navbar/>
      Account Settings
    </div>
  )
}

export default AccountSettings
