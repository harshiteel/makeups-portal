import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import Navbar from "@/components/navbar";
import ApplicationForm from "@/components/application-form";

import StudentDashboard from "@/components/student-dashboard";
import FacultyDashboard from "@/components/faculty-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [accountType, setAccountType] = useState("");

  const [navBarPage, setNavBarPage] = useState("Dashboard");

  const [searchTerm, setSearchTerm] = useState("");

  const fetchAccountType = async () => {
    try {
      const response = await fetch("/api/check-account-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session?.user?.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch account type");
      }

      const data = await response.json();
      setAccountType(data.accountType);
    } catch (error) {
      alert("Unauthorized access")
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    } else if (status === "authenticated") {
      fetchAccountType();
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        session={session}
        navBarPage={navBarPage}
        setNavBarPage={setNavBarPage}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="flex-grow">
        {navBarPage === "Dashboard" ? (
          accountType === "admin" ? (
            <AdminDashboard searchTerm={searchTerm}/>
          ) : accountType === "faculty" ? (
            <FacultyDashboard searchTerm={searchTerm}/>
          ) : (
            <StudentDashboard searchTerm={searchTerm}/>
          )
        ) : navBarPage === "Application Form" ? (
          <ApplicationForm user={session?.user?.name ?? ""} email={session?.user?.email ?? ""}/>
        ) : (
          <div>Error</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
