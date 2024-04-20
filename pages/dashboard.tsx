import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";

import Navbar from "@/components/navbar";
import ApplicationForm from "@/components/application-form";

import StudentDashboard from "@/components/student-dashboard";
import FacultyDashboard from "@/components/faculty-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [accountType, setAccountType] = useState("student"); //TODO: Get account type from session

  const [navBarPage, setNavBarPage] = useState("Application Form");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex flex-col">

      <Navbar session={session} navBarPage={navBarPage} setNavBarPage={setNavBarPage} />

      <div className="flex-grow">
        {navBarPage === "Dashboard" ? (
          accountType === "admin" ? <AdminDashboard /> : accountType === "faculty" ? <FacultyDashboard /> : <StudentDashboard />
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
