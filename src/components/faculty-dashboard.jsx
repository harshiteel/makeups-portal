import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  ButtonGroup,
} from "@nextui-org/react";

import { Tabs, Tab } from "@nextui-org/react";
import { useSession } from "next-auth/react";

const FacultyDashboard = ({ searchTerm }) => {
  const { data: session } = useSession();
  const [makeupRequests, setMakeupRequests] = useState([]);
  const [facultyCourseCode, setFacultyCourseCode] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");

  async function getFacultyCourseCode(fE) {
    try {
      const response = await fetch("/api/fetch-faculty-course-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: fE, session: session }),
      });

      const data = await response.json();
      setFacultyCourseCode(data.courseCode);
    } catch (error) {
      alert(
        "We couldn't find any courses registered to you as its Instructor Incharge. If you think this is a mistake, please contact TimeTable Division."
      );
    }
  }

  async function fetchData(courseCode, status) {
    try {
      // const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      const response = await fetch("/api/fetch-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseCode: courseCode,
          status: status,
          session: session,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a["submission-time"]);
        const dateB = new Date(b["submission-time"]);
        return dateB.getTime() - dateA.getTime();
      });
      setMakeupRequests(sortedData);
    } catch (error) {
      alert(error.message);
    }
  }

  useEffect(() => {
    document.title = "Faculty Dashboard";
    const fetchDataByTab = async () => {
      if (session?.user?.email) {
        await getFacultyCourseCode(session.user.email);
      }
      if (facultyCourseCode) {
        await fetchData(facultyCourseCode, activeTab);
      }
    };

    fetchDataByTab();
  }, [session, facultyCourseCode, activeTab]);

  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const options = {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    return date.toLocaleString("en-GB", options);
  }

  async function updateRequestStatus(id, status) {
    try {
      const response = await fetch("/api/update-request-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id, status: status, session: session }),
      });

      console.log("aa ", id, status, session);

      if (!response.ok) {
        throw new Error(
          "Failed to update request status, " + JSON.stringify(response)
        );
      }

      alert("Request status updated successfully");

      // Refresh makeup requests after update
      await fetchData(facultyCourseCode, activeTab);
    } catch (error) {
      alert(error.message);
    }
  }

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10; // Hardcoded to 10 entries per page. TODO: User defined

  const pages = Math.ceil(makeupRequests.length / rowsPerPage);

  const filteredRequests = React.useMemo(() => {
    if (!searchTerm) return makeupRequests;
    return makeupRequests.filter((request) =>
      Object.values(request).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, makeupRequests]);

  const paginatedRequests = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRequests.slice(start, end);
  }, [page, filteredRequests]);

  return (
    <div className="flex flex-col items-center h-screen">
      <h1 className="font-semibold my-4 italic text-center">
        {session?.user?.name}'s Faculty Dashboard
      </h1>

      <Tabs
        className="flex items-center my-6 justify-center"
        activeKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key);
          fetchData(facultyCourseCode, key);
        }}
      >
        <Tab key="Pending" title="Pending Requests" />
        <Tab key="Accepted" title="Accepted Requests" />
        <Tab key="Denied" title="Rejected Requests" />
      </Tabs>

      <Table
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={pages}
              onChange={(page) => setPage(page)}
            />
          </div>
        }
        classNames={{
          wrapper: "min-h-[222px]",
        }}
      >
        <TableHeader className="items-center justify-center flex">
          <TableColumn className="text-center">Name</TableColumn>
          <TableColumn className="text-center">ID Number</TableColumn>
          <TableColumn className="text-center">Course Code</TableColumn>
          <TableColumn className="text-center">
            Evaluative Component
          </TableColumn>
          <TableColumn className="text-center">Reason</TableColumn>
          <TableColumn className="text-center">Submitted At</TableColumn>
          <TableColumn className="text-center">Attachments</TableColumn>
          <TableColumn className="text-center">Actions</TableColumn>
        </TableHeader>
        <TableBody items={paginatedRequests}>
          {paginatedRequests.map((request, index) => (
            <TableRow key={index}>
              <TableCell className="text-center">{request.name}</TableCell>
              <TableCell className="text-center">{request.idNumber}</TableCell>
              <TableCell className="text-center">
                {request.courseCode}
              </TableCell>
              <TableCell className="text-center">
                {request.evalComponent}
              </TableCell>
              <TableCell className="text-center">
                {request.reason.length > 20
                  ? `${request.reason.slice(0, 20)}...`
                  : request.reason}
              </TableCell>
              <TableCell className="text-center">
                {formatDateTime(request["submission-time"])}
              </TableCell>
              <TableCell className="text-center">
                <Button size="sm" radius="full" variant="light" color="primary">
                  View Attachments
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex gap-4 items-center justify-center">
                  <ButtonGroup>
                    <Button
                      size="sm"
                      radius="md"
                      color="success"
                      onClick={() =>
                        updateRequestStatus(request._id, "Accepted")
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      radius="md"
                      color="danger"
                      onClick={() => updateRequestStatus(request._id, "Denied")}
                    >
                      Deny
                    </Button>
                  </ButtonGroup>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FacultyDashboard;
