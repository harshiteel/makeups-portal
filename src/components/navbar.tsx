import React, { useEffect, useState } from "react";
import {
  Input,
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@nextui-org/react";
import { signOut, useSession } from "next-auth/react";
import TDLogo from "../../public/images/tdlogo-01.png";
import Image from "next/image";

interface NavbarProps {
  session?: any;
  setNavBarPage: (page: string) => void;
  navBarPage?: any;
  searchTerm?: any;
  setSearchTerm?: (term: string) => void;
  userEmail?: string;
}

export default function Navbar({
  navBarPage,
  setNavBarPage,
  searchTerm,
  setSearchTerm,
  userEmail
}: NavbarProps) {
  const logoutUser = async () => {
    await signOut({ callbackUrl: "/makeups" });
  };

  const { data: session, status } = useSession();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [accountType, setAccountType] = useState("");

  const handleMenuItemClick = async (item: string) => {
    if (window.location.pathname === "/makeups/account")
      await window.location.replace("/makeups/dashboard");
    setNavBarPage(item);
  };

  const menuItems = ["Dashboard", "Application Form"];

  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const response = await fetch("/makeups/api/check-account-type", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userEmail }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch account type");
        }

        const data = await response.json();
        setAccountType(data.accountType);
      } catch (error) {
        // alert("Unauthorized access");
      }
    };

    fetchAccountType();
  }, []);

  return (
    <NextUINavbar onMenuOpenChange={setIsMenuOpen} className=" shadow-sm">
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />

        <NavbarBrand>
          <Image src={TDLogo} alt="TD Logo" width={256} height={64}/>
        </NavbarBrand>

        <NavbarBrand>
          <p className="font-bold text-inherit">Makeups Portal</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="flex-grow flex items-center justify-end space-x-4">
        <NavbarItem className={navBarPage === "Dashboard" ? "isActive" : ""}>
          <Link
            style={{
              color: navBarPage === "Dashboard" ? "rgb(200,0,200)" : "inherit",
              fontWeight: navBarPage === "Dashboard" ? "bold" : "normal",
            }}
            onClick={() => handleMenuItemClick("Dashboard")}
            className="cursor-pointer"
          >
            Dashboard
          </Link>
        </NavbarItem>
        {/* TODO: Fix. api not getting correct email for checking account type. */}
        {/* {accountType === "student" && ( */}
          <NavbarItem
            className={navBarPage === "Application Form" ? "isActive" : ""}
          >
            <Link
              style={{
                color: navBarPage === "Application Form" ? "blue" : "inherit",
                fontWeight:
                  navBarPage === "Application Form" ? "bold" : "normal",
              }}
              onClick={() => handleMenuItemClick("Application Form")}
              className="cursor-pointer"
            >
              Application Form
            </Link>
          </NavbarItem>
        {/* )} */}
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <NavbarItem>
          <Input
            type="text"
            key="inside"
            labelPlacement="inside"
            size="sm"
            variant="bordered"
            label="Search"
            isClearable
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
        </NavbarItem>
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="secondary"
              name={session?.user?.name?.[0] ?? ""}
              size="sm"
              src={session?.user?.image ?? ""}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{session?.user?.email}</p>
            </DropdownItem>
            <DropdownItem
              key="settings"
              onClick={() => (window.location.href = "/makeups/account")}
            >
              Account Settings
            </DropdownItem>

            <DropdownItem key="logout" color="danger" onClick={logoutUser}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              color={
                index === 2
                  ? "primary"
                  : index === menuItems.length - 1
                  ? "primary"
                  : "foreground"
              }
              className="w-full"
              href="#"
              size="lg"
              onClick={() => handleMenuItemClick(item)}
            >
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </NextUINavbar>
  );
}
