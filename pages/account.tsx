import React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar from "@/components/navbar";
import { Switch, cn } from "@nextui-org/react";
// import "../src/app/globals.css";

const AccountSettings = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }),
    [status, router];
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const [navBarPage, setNavBarPage] = useState("Dashboard");
  const handleToggle = () => {
    setReceiveUpdates(!receiveUpdates);
  };

  return (
    <div>
      <Navbar session={session} setNavBarPage={setNavBarPage} navBarPage={navBarPage} />
      <h1>Account Settings</h1>
      <div className="flex items-center">
        <Switch
          classNames={{
            base: cn(
              "inline-flex flex-row-reverse w-full max-w-md bg-content1 hover:bg-content2 items-center",
              "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
              "data-[selected=true]:border-primary "
            ),
            wrapper: "p-0 h-4 overflow-visible",
            thumb: cn(
              "w-6 h-6 border-2 shadow-lg",
              "group-data-[hover=true]:border-primary",
              //selected
              "group-data-[selected=true]:ml-6",
              // pressed
              "group-data-[pressed=true]:w-7",
              "group-data-[selected]:group-data-[pressed]:ml-4"
            ),
          }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-medium">Enable Email Notifications</p>
            <p className="text-tiny text-default-400">
              Updates will be communicated via email.
            </p>
          </div>
        </Switch>
      </div>
    </div>
  );
};

export default AccountSettings;
