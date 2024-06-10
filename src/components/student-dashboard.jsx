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
  Tabs,
  Tab,
} from "@nextui-org/react";
import { useSession } from "next-auth/react";

const StudentDashboard = ({ searchTerm }) => {
  const { data: session } = useSession();
  const [makeupRequests, setMakeupRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");

  async function getMyRequests(st) {
    try {
      const response = await fetch("/api/fetch-my-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session?.user?.email, session: session, status: st }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch makeup requests");
      }

      const data = await response.json();
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a["submission-time"]);
        const dateB = new Date(b["submission-time"]);
        return dateB - dateA;
      });
      setMakeupRequests(sortedData);
    } catch (error) {
      // alert("Failed to fetch makeup requests");
    }
  }

  useEffect(() => {
    document.title = "Student Dashboard";

    if (session) {
      getMyRequests(session?.user?.email);
    }
  }, [session]);

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

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10; // Hardcoded to 10 entries per page. TODO: User defined

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

  const pages = Math.ceil(filteredRequests.length / rowsPerPage);

  return (
    <div>
      <h1 className="font-semibold my-4 italic text-center">
        {session?.user?.name}'s Student Dashboard
      </h1>

      <Tabs
        className="flex items-center my-6 justify-center"
        activeKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key);
          getMyRequests(key);
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
          <TableColumn title="Name" className="text-center" />
          <TableColumn title="ID Number" className="text-center" />
          <TableColumn title="Course Code" className="text-center" />
          <TableColumn title="Evaluative Component" className="text-center" />
          <TableColumn title="Reason" className="text-center" />
          <TableColumn title="Submitted At" className="text-center" />
          <TableColumn title="Attachments" className="text-center" />
          <TableColumn title="Status" className="text-center" />
        </TableHeader>
        <TableBody items={paginatedRequests} emptyContent={"No rows to display."}>
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
              <TableCell className="text-center">{request.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StudentDashboard;
