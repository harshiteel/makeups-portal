"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import "./globals.css";
import { Button, Card, CardBody } from "@nextui-org/react";
import { useState } from "react";
import GoogleSVG from '../../public/images/google-icon-logo-svg.svg'
import TDLogo from '../../public/images/tdlogo-01.png'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await signIn("google", { callbackUrl: "/makeups/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black flex-col">
      <div className="w-64 h-64 relative mr-4 left-8">
        <Image
          src={TDLogo}
          alt="TD Logo"
          width={256}
          height={64}
        />
      </div>
      <Card className="flex md:w-1/2 lg:w-1/2 sm:w-full items-center justify-center mx-auto">
        <CardBody>
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-3xl font-bold">Makeups Portal</h1>
            <p className="lg:text-lg md:text-md sm:text-sm italic">
              Managed By TimeTable Division, BITS Pilani Hyderabad Campus
            </p>
          </div>

          {/* Auth section */}
          <div className="flex flex-col space-y-4 items-center my-8">
            <Button
              color="default"
              size="lg"
              variant="shadow"
              onClick={handleLogin}
              isLoading={isLoading}
            >
              {!isLoading && (
                <Image
                  src={GoogleSVG}
                  width={32}
                  height={32}
                  alt="G"
                />
              )}
              <h1 className=" font-semibold text-center">Login with Google</h1>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
