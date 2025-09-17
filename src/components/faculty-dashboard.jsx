"use client";

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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
  Card,
  CardBody,
  Textarea,
  Divider,
} from "@nextui-org/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import DateRangeFilter from "./date-filter";

const FacultyDashboard = ({ searchTerm }) => {
  const { data: session } = useSession();
  const [makeupRequests, setMakeupRequests] = useState([]);
  const [facultyCourseCode, setFacultyCourseCode] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [scrollBehavior] = React.useState("inside");
  const [modalData, setModalData] = React.useState(null);
  const [attachments, setAttachments] = React.useState([]);
  const [facRemarks, setFacRemarks] = React.useState("");

  async function getFacultyCourseCode(fE) {
    try {
      setIsLoading(true);
      const response = await fetch("/makeups/api/fetch-faculty-course-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: fE, session: session }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch faculty course code");
      }

      const data = await response.json();
      setFacultyCourseCode(data.courseCode);
    } catch (error) {
      console.error("Error fetching faculty course code:", error);
      alert(
        "We couldn't find any courses registered to you as its Instructor Incharge. If you think this is a mistake, please contact TimeTable Division."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchData(courseCode, status) {
    if (!courseCode) return; // Don't attempt to fetch if course code isn't available

    try {
      setIsLoading(true);
      const response = await fetch("/makeups/api/fetch-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify({
          courseCode: courseCode,
          status: status,
          session: session,
          timestamp: Date.now(), // Cache buster
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch requests");
      }

      const data = await response.json();
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a["submission-time"]);
        const dateB = new Date(b["submission-time"]);
        return dateB.getTime() - dateA.getTime();
      });
      setMakeupRequests(sortedData);
    } catch (error) {
      console.error("Error fetching requests:", error);
      // Only show alert for non-empty course codes to avoid annoying errors during initialization
      if (courseCode) {
        alert(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAttachments(oid) {
    try {
      setIsLoading(true);
      const response = await fetch("/makeups/api/fetch-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: oid, session: session }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attachments");
      }

      const data = await response.json();
      setAttachments(data);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const openAttachment = (attachment) => {
    const byteCharacters = atob(attachment.data);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.mimeType });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  useEffect(() => {
    document.title = "Faculty Dashboard | Makeups Portal";

    if (session?.user?.email && !facultyCourseCode) {
      getFacultyCourseCode(session.user.email);
    }
  }, [session]);

  useEffect(() => {
    if (facultyCourseCode && activeTab) {
      fetchData(facultyCourseCode, activeTab);
    }
  }, [facultyCourseCode, activeTab]);

  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const options = {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Kolkata", // Convert to IST
};
    return date.toLocaleString("en-GB", options);
  }

  async function updateRequestStatus(id, status) {
    try {
      setIsLoading(true);
      const response = await fetch("/makeups/api/faculty-update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          status: status,
          session: session,
          facRemarks: facRemarks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update request status");
      }

      // Clear remarks after successful update
      setFacRemarks("");

      // Success message
      alert("Request status updated successfully");

      // Refresh data with the current tab
      await fetchData(facultyCourseCode, activeTab);
    } catch (error) {
      console.error("Error updating request status:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    // Reset to first page when filter changes
    setPage(1);
  };

  // Function to download makeup requests as CSV
  const downloadCSV = () => {
    if (filteredRequests.length === 0) {
      alert("No data to export");
      return;
    }

    // Define CSV headers
    const headers = [
      "Name",
      "ID Number", 
      "Email",
      "Course Code",
      "Evaluative Component",
      "Reason",
      "Submitted At",
      "Status",
      "Faculty Remarks"
    ];

    // Convert data to CSV format
    const csvData = filteredRequests.map(request => [
      request.name || "",
      request.idNumber || "",
      request.email || "",
      request.courseCode || "",
      request.evalComponent || "",
      `"${(request.reason || "").replace(/"/g, '""')}"`, // Escape quotes in reason
      formatDateTime(request["submission-time"]) || "",
      request.status || "",
      `"${(request.facRemarks || "").replace(/"/g, '""')}"` // Escape quotes in faculty remarks
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `faculty-makeup-requests-${activeTab.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10; // Hardcoded to 10 entries per page. TODO: User defined

  const filteredRequests = React.useMemo(() => {
    let filtered = makeupRequests;

    // Text search filter
    if (searchTerm) {
      filtered = filtered.filter((request) =>
        Object.values(request).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((request) => {
        const submissionDate = new Date(request["submission-time"]);

        // Check if submission date is after start date (if provided)
        const afterStartDate = dateFilter.startDate
          ? submissionDate >= dateFilter.startDate
          : true;

        // Check if submission date is before end date (if provided)
        // Add one day to end date to include the entire end date
        const beforeEndDate = dateFilter.endDate
          ? submissionDate <=
            new Date(dateFilter.endDate.setHours(23, 59, 59, 999))
          : true;

        return afterStartDate && beforeEndDate;
      });
    }

    return filtered;
  }, [searchTerm, makeupRequests, dateFilter]);

  const pages = Math.ceil(filteredRequests.length / rowsPerPage);

  const paginatedRequests = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRequests.slice(start, end);
  }, [page, filteredRequests]);

  // Function to check if buttons should be disabled
  const isActionDisabled = (status) => {
    return (
      status === "Accepted" ||
      status === "Denied" ||
      status === "faculty approved" ||
      isLoading
    );
  };

  return (
    <div className="flex flex-col items-center h-screen">
      <h1 className="font-semibold my-4 italic text-center">
        {session?.user?.name}&apos;s Faculty Dashboard
      </h1>

      <p className="italic font-sm">Click a row to open detailed view</p>

      <Tabs
        className="flex items-center my-6 justify-center"
        activeKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key);
        }}
      >
        <Tab key="Pending" title="Pending Requests" />
        <Tab key="faculty approved" title="Faculty Approved" />
        <Tab key="Accepted" title="Accepted Requests" />
        <Tab key="Denied" title="Rejected Requests" />
      </Tabs>

      {/* Date filter component */}
      <div className="w-full max-w-7xl px-4">
        <DateRangeFilter onFilterChange={handleDateFilterChange} />
      </div>

      {/* Download CSV button */}
      <div className="w-full max-w-md flex justify-center my-4">
        <Button
          color="primary"
          variant="solid"
          onClick={downloadCSV}
          disabled={filteredRequests.length === 0}
        >
          📥 Download CSV ({filteredRequests.length} requests)
        </Button>
      </div>
      {filteredRequests.length > 0 && (
        <div className="text-sm text-gray-500 my-2">
          Showing {filteredRequests.length}{" "}
          {filteredRequests.length === 1 ? "request" : "requests"}
          {(dateFilter.startDate || dateFilter.endDate) &&
            " with date filter applied"}
        </div>
      )}
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
          <TableColumn className="text-center">Actions</TableColumn>
        </TableHeader>
        <TableBody
          items={paginatedRequests}
          emptyContent={isLoading ? "Loading..." : "No rows to display."}
        >
          {paginatedRequests.map((request, index) => (
            <TableRow
              key={index}
              className="hover:bg-gray-100 hover:cursor-pointer hover:shadow-sm hover:delay-[150]"
              onClick={() => {
                setModalData(request);
                setFacRemarks(request.facRemarks || ""); // Pre-fill existing remarks if any
                onOpen();
                fetchAttachments(request._id);
              }}
            >
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
                <div className="flex gap-4 items-center justify-center">
                  <ButtonGroup>
                    <Button
                      size="sm"
                      radius="md"
                      color="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateRequestStatus(request._id, "Accepted");
                      }}
                      isDisabled={isActionDisabled(request.status)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      radius="md"
                      color="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateRequestStatus(request._id, "Denied");
                      }}
                      isDisabled={isActionDisabled(request.status)}
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

      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) setFacRemarks(""); // Clear remarks when closing modal
          onOpenChange(open);
        }}
        scrollBehavior={scrollBehavior}
        size="5xl"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-4">
                {modalData?.name}&apos;s Makeup Request:
              </ModalHeader>
              <ModalBody>
                {modalData && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Name:
                      </h3>
                      <p className="text-base mb-0">{modalData.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Email:
                      </h3>
                      <p className="text-base mb-0">{modalData.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        ID Number:
                      </h3>
                      <p className="text-base mb-0">{modalData.idNumber}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Course Code:
                      </h3>
                      <p className="text-base mb-0">{modalData.courseCode}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Status:
                      </h3>
                      <p className="text-base mb-0">{modalData.status}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Evaluative Component:
                      </h3>
                      <p className="text-base mb-0">
                        {modalData.evalComponent}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Reason for Makeup:
                      </h3>
                      <p className="text-base mb-0">{modalData.reason}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Submitted On:
                      </h3>
                      <p className="text-base mb-0">
                        {formatDateTime(modalData["submission-time"])}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold italic text-sm mb-0">
                        Attachments:
                      </h3>

                      {Object.keys(attachments).length > 0 ? (
                        Object.keys(attachments).map((key, index) => (
                          <div
                            onClick={() => openAttachment(attachments[key])}
                            key={index}
                          >
                            <Card
                              className="hover:cursor-pointer"
                              onClick={() => openAttachment(attachments[key])}
                            >
                              <CardBody className="flex flex-row items-start">
                                <Image
                                  src="/makeups/images/file-icon.svg"
                                  width={24}
                                  height={24}
                                  alt=""
                                />
                                <p className="text-sm mx-6">
                                  {key.replace("attachment-", "")}
                                </p>
                              </CardBody>
                            </Card>
                          </div>
                        ))
                      ) : (
                        <p className="text-base mb-0">No attachments</p>
                      )}
                    </div>

                    {modalData.facRemarks && (
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold italic text-sm mb-0">
                          Faculty Remarks:
                        </h3>
                        <p className="text-base mb-0">{modalData.facRemarks}</p>
                      </div>
                    )}
                  </div>
                )}

                <Divider className="my-4" />

                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                  <Textarea
                    label="Remarks: "
                    placeholder="Please leave any remarks (optional) for the student here."
                    onValueChange={(value) => setFacRemarks(value)}
                    value={facRemarks}
                  />
                </div>

                {modalData && (
                  <ButtonGroup>
                    <Button
                      size="sm"
                      radius="md"
                      color="success"
                      onClick={() => {
                        onClose();
                        updateRequestStatus(modalData._id, "Accepted");
                      }}
                      isDisabled={isActionDisabled(modalData.status)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      radius="md"
                      color="danger"
                      onClick={() => {
                        onClose();
                        updateRequestStatus(modalData._id, "Denied");
                      }}
                      isDisabled={isActionDisabled(modalData.status)}
                    >
                      Deny
                    </Button>
                  </ButtonGroup>
                )}
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default FacultyDashboard;
