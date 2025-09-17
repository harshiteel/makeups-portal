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
  Chip,
} from "@nextui-org/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Select from "react-select";
import FileIconSVG from "../../public/images/file-icon.svg";
import DateRangeFilter from "@/components/date-filter";
import AdminTempExtensions from '@/components/AdminTempExtensions';

const AdminDashboard = ({ searchTerm }) => {
  const { data: session } = useSession();
  const [makeupRequests, setMakeupRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  // Changed from string to array to support multiple course codes
  const [courseCodeFilters, setCourseCodeFilters] = useState([]);
  const [courseCodes, setCourseCodes] = useState([]);

  // Modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [scrollBehavior, setScrollBehavior] = React.useState("inside");
  const [modalData, setModalData] = React.useState(null);
  const [attachments, setAttachments] = React.useState([]);

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
    link.setAttribute("download", `makeup-requests-${activeTab.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function fetchData(status) {
    const response = await fetch("/makeups/api/fetch-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: status, session: session }),
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
  }

  const getCourseCodes = async () => {
    try {
      const response = await fetch("/makeups/api/get-all-course-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourseCodes(data.courseCodes);
    } catch (error) {
      console.log(error);
      alert("Error fetching course codes");
    }
  };

  // Add function to update request status - without faculty remarks
  async function updateRequestStatus(id, status) {
    try {
      const response = await fetch("/makeups/api/ttd-update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          status: status,
          session: session,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to update request status"
        );
      }

      // Success case
      alert(data.message || "Request status updated successfully");

      // Refresh makeup requests after update
      await fetchData(activeTab);
    } catch (error) {
      alert(error.message || "An error occurred while updating the request");
      console.error("Update error:", error);
    }
  }

  useEffect(() => {
    document.title = "Admin Dashboard | Makeups Portal";
    if (session) {
      fetchData(activeTab);
      getCourseCodes();
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
      timeZone: "Asia/Kolkata", // Convert to IST
    };
    return date.toLocaleString("en-GB", options);
  }

  async function fetchAttachments(oid) {
    try {
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
      alert(error.message);
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

  const handleDateFilterChange = (filterValues) => {
    setDateFilter(filterValues);
    setPage(1);
  };

  // Updated to handle multiple selections
  const handleCourseCodeFilterChange = (selectedOptions) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setCourseCodeFilters(selectedValues);
    setPage(1);
  };

  const courseOptions = courseCodes.map((cc) => ({
    value: cc,
    label: cc,
  }));

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredRequests = React.useMemo(() => {
    let filtered = makeupRequests;

    if (searchTerm) {
      filtered = filtered.filter((request) =>
        Object.values(request).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((request) => {
        const submissionDate = new Date(request["submission-time"]);

        const afterStartDate = dateFilter.startDate
          ? submissionDate >= dateFilter.startDate
          : true;
        const beforeEndDate = dateFilter.endDate
          ? submissionDate <=
            new Date(dateFilter.endDate.setHours(23, 59, 59, 999))
          : true;

        return afterStartDate && beforeEndDate;
      });
    }

    // Updated to filter by multiple course codes
    if (courseCodeFilters.length > 0) {
      filtered = filtered.filter((request) =>
        courseCodeFilters.some((code) =>
          request.courseCode.toLowerCase().includes(code.toLowerCase())
        )
      );
    }

    return filtered;
  }, [searchTerm, makeupRequests, dateFilter, courseCodeFilters]);

  const paginatedRequests = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRequests.slice(start, end);
  }, [page, filteredRequests]);

  const pages = Math.ceil(filteredRequests.length / rowsPerPage);

  // Function to render action buttons only for "faculty approved" status
  const renderActionButtons = (request) => {
    if (request.status === "faculty approved") {
      return (
        <ButtonGroup>
          <Button
            size="sm"
            radius="md"
            color="success"
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the modal
              updateRequestStatus(request._id, "Accepted");
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            radius="md"
            color="danger"
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the modal
              updateRequestStatus(request._id, "Denied");
            }}
          >
            Deny
          </Button>
        </ButtonGroup>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center h-screen">
      <h1 className="font-semibold my-4 italic text-center">
        {session?.user?.name}&apos;s Admin Dashboard
      </h1>
      <p className="italic font-sm">Click a row to open detailed view</p>

      <Tabs
        className="flex items-center my-6 justify-center"
        activeKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key);
          fetchData(key);
          setDateFilter({ startDate: null, endDate: null });
          setCourseCodeFilters([]);
        }}
      >
        <Tab key="Pending" title="Pending Requests" />
        <Tab key="faculty approved" title="Faculty Approved" />
        <Tab key="Accepted" title="Accepted Requests" />
        <Tab key="Denied" title="Rejected Requests" />
      </Tabs>
      <div className="w-full max-w-6xl px-4 flex flex-col items-center space-y-4">
        <div className="w-full max-w-md">
          <DateRangeFilter onFilterChange={handleDateFilterChange} />
        </div>

        <div className="w-full max-w-md">
          <label
            htmlFor="courseCodeFilter"
            className="text-sm text-gray-500 mb-1 block"
          >
            Filter by Course Code(s):
          </label>
          <Select
            id="courseCodeFilter"
            options={courseOptions}
            onChange={handleCourseCodeFilterChange}
            placeholder="Select one or more course codes..."
            isMulti
            isClearable
            value={courseOptions.filter((option) =>
              courseCodeFilters.includes(option.value)
            )}
          />
        </div>

        <div className="w-full max-w-md flex justify-center">
          <Button
            color="primary"
            variant="solid"
            onClick={downloadCSV}
            disabled={filteredRequests.length === 0}
            className="mb-4"
          >
            📥 Download CSV ({filteredRequests.length} requests)
          </Button>
        </div>
      </div>

      {filteredRequests.length >= 0 && (
        <div className="text-sm text-gray-500 my-2">
          Showing {filteredRequests.length}{" "}
          {filteredRequests.length === 1 ? "request" : "requests"}
          {(dateFilter.startDate ||
            dateFilter.endDate ||
            courseCodeFilters.length > 0) &&
            " with filters applied"}
        </div>
      )}

      {(dateFilter.startDate ||
        dateFilter.endDate ||
        courseCodeFilters.length > 0) && (
        <Button
          size="sm"
          color="secondary"
          variant="light"
          className="mb-2"
          onClick={() => {
            setDateFilter({ startDate: null, endDate: null });
            setCourseCodeFilters([]);
          }}
        >
          Reset All Filters
        </Button>
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
          <TableColumn className="text-center">Status</TableColumn>
          <TableColumn className="text-center">Actions</TableColumn>
        </TableHeader>
        <TableBody
          items={paginatedRequests}
          emptyContent={"No rows to display."}
        >
          {paginatedRequests.map((request, index) => (
            <TableRow
              key={index}
              className=" hover:bg-gray-100 hover:cursor-pointer hover:shadow-sm hover:delay-[150]"
              onClick={() => {
                setModalData(request);
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
              <TableCell className="text-center">{request.status}</TableCell>
              <TableCell
                className="text-center"
                onClick={(e) => e.stopPropagation()} // Prevent row click when clicking on action buttons
              >
                {renderActionButtons(request)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">Name:</h3>
                    <p className="text-base mb-0">{modalData?.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Email:
                    </h3>
                    <p className="text-base mb-0">{modalData?.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      ID Number:
                    </h3>
                    <p className="text-base mb-0">{modalData?.idNumber}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Course Code:
                    </h3>
                    <p className="text-base mb-0">{modalData?.courseCode}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Evaluative Component:
                    </h3>
                    <p className="text-base mb-0">{modalData?.evalComponent}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Reason for Makeup:
                    </h3>
                    <p className="text-base mb-0">{modalData?.reason}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Submitted On:
                    </h3>
                    <p className="text-base mb-0">
                      {modalData &&
                        formatDateTime(modalData["submission-time"])}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Status:
                    </h3>
                    <p className="text-base mb-0">{modalData?.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Attachments:
                    </h3>

                    {Object.keys(attachments).map((key, index) => (
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
                              src={FileIconSVG || "/placeholder.svg"}
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
                    ))}
                  </div>
                </div>

                {modalData?.facRemarks && (
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="font-semibold italic text-sm mb-0">
                      Faculty Remarks:
                    </h3>
                    <p className="text-base mb-0">{modalData.facRemarks}</p>
                  </div>
                )}

                {modalData?.status === "faculty approved" && (
                  <div className="mt-4 flex justify-center gap-4">
                    <Button
                      size="md"
                      radius="md"
                      color="success"
                      onClick={() => {
                        onClose();
                        updateRequestStatus(modalData._id, "Accepted");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="md"
                      radius="md"
                      color="danger"
                      onClick={() => {
                        onClose();
                        updateRequestStatus(modalData._id, "Denied");
                      }}
                    >
                      Deny
                    </Button>
                  </div>
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

      <AdminTempExtensions session={session} />
    </div>
  );
};

export default AdminDashboard;
