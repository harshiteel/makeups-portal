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
      // console.log("d", data);
      setAccountType(data.accountType);
    } catch (error) {
      // console.error("Error fetching account type:", error);
      setAccountType("student");
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
      />

      <div className="flex-grow">
        {navBarPage === "Dashboard" ? (
          accountType === "admin" ? (
            <AdminDashboard />
          ) : accountType === "faculty" ? (
            <FacultyDashboard />
          ) : (
            <StudentDashboard />
          )
        ) : navBarPage === "Application Form" ? (
          <ApplicationForm user={session?.user?.name ?? ""} />
        ) : (
          <div>Error</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
