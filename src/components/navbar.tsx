import React, { useState } from "react";
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
import { signOut } from "next-auth/react";
import TDLogo from "../../public/images/tdlogo-01.png";
import Image from "next/image";

interface NavbarProps {
  session: any;
  setNavBarPage: (page: string) => void;
  navBarPage: any;
  searchTerm: any;
  setSearchTerm: (term: string) => void;
}

export default function Navbar({
  session,
  navBarPage,
  setNavBarPage,
  searchTerm,
  setSearchTerm
}: NavbarProps) {
  const logoutUser = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleMenuItemClick = async (item: string) => {
    if (window.location.pathname === "/account")
      await window.location.replace("/dashboard");
    setNavBarPage(item);
  };

  const menuItems = ["Dashboard", "Application Form"];

  return (
    <NextUINavbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />

        <NavbarBrand>
          <Image src={TDLogo} alt="TD Logo" width={256} height={64} />
        </NavbarBrand>
        
        <NavbarBrand>
          <p className="font-bold text-inherit">Makeups Portal</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
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
        <NavbarItem
          className={navBarPage === "Application Form" ? "isActive" : ""}
        >
          <Link
            style={{
              color: navBarPage === "Application Form" ? "blue" : "inherit",
              fontWeight: navBarPage === "Application Form" ? "bold" : "normal",
            }}
            onClick={() => handleMenuItemClick("Application Form")}
            className="cursor-pointer"
          >
            Application Form
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <NavbarItem>
        <Input type="text" key="inside" labelPlacement="inside" size="sm" variant="bordered" label="Search" isClearable value={searchTerm} onValueChange={setSearchTerm}/>
        </NavbarItem>
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="secondary"
              name={session?.user?.name[0]}
              size="sm"
              src={session?.user?.image}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{session?.user?.email}</p>
            </DropdownItem>
            <DropdownItem
              key="settings"
              onClick={() => (window.location.href = "/account")}
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
