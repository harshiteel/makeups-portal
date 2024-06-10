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
  RadioGroup,
  Radio,
  Tabs,
  Tab,
  Card,
  CardBody,
} from "@nextui-org/react";
import { useSession } from "next-auth/react";
import Image from "next/image";

const FacultyDashboard = ({ searchTerm }) => {
  const { data: session } = useSession();
  const [makeupRequests, setMakeupRequests] = useState([]);
  const [facultyCourseCode, setFacultyCourseCode] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");

  // Modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [scrollBehavior, setScrollBehavior] = React.useState("inside");
  const [modalData, setModalData] = React.useState(null);
  const [attachments, setAttachments] = React.useState([]);

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

  async function fetchAttachments(oid) {
    try {
      const response = await fetch("/api/fetch-attachments", {
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

  // Helper function to get file extension from magic number
  function getFileExtensionFromMagicNumber(magicNumber) {
    switch (magicNumber) {
      case "JVBERi0xLjMK": // PDF magic number
        return "pdf";
      case "/9j/4AAQSkZJRgAB": // JPG and JPEG magic number
        return "jpg";
      case "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h": // PNG magic number
        return "png";
      default:
        return null; // Unknown file type
    }
  }

  const openAttachment = (attachmentKey) => {
    try {
      const base64Data = attachments[attachmentKey];
      
      // Check if base64Data is a valid Base64-encoded string
      if (!isValidBase64(base64Data)) {
        alert('Invalid Base64 data:', base64Data);
        return;
      }
  
      const binaryData = atob(base64Data);
  
      const magicNumber = binaryData.substring(0, 24);
  
      // Determine file extension based on magic number
      const fileExtension = getFileExtensionFromMagicNumber(magicNumber);
  
      // Create Blob object with appropriate type based on file extension
      const blobType = fileExtension === 'pdf' ? 'application/pdf' : `image/${fileExtension}`;
      const blob = new Blob([binaryData], { type: blobType });
  
      // Create object URL
      const url = URL.createObjectURL(blob);
  
      // Open URL in new window/tab
      window.open(url, '_blank');
    } catch (error) {
      alert('Error decoding Base64 data:', error);
    }
  };
  
  // Helper function to check if a string is a valid Base64-encoded string
  const isValidBase64 = (str) => {
    try {
      return btoa(atob(str)) === str;
    } catch (error) {
      return false;
    }
  };
  

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
                      isDisabled={request.status === "Accepted"}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      radius="md"
                      color="danger"
                      onClick={() => updateRequestStatus(request._id, "Denied")}
                      isDisabled={request.status === "Denied"}
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
        onOpenChange={onOpenChange}
        scrollBehavior={scrollBehavior}
        size="5xl"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-4">
                {modalData.name}'s Makeup Request:
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold italic text-sm mb-0">Name:</h3>
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
                      Evaluative Component:
                    </h3>
                    <p className="text-base mb-0">{modalData.evalComponent}</p>
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

                    {Object.keys(attachments).map((key, index) => (
                      <div onClick={()=>openAttachment(attachments[key])} key={index}>
                        <Card
                          className="hover:cursor-pointer"
                          onClick={() => openAttachment(attachments[key])}
                        >
                          <CardBody className="flex flex-row items-start">
                            <Image
                              src="/images/file-icon.svg"
                              width={24}
                              height={24}
                              alt=""
                            />
                            <p className="text-sm mx-6">{key}</p>
                          </CardBody>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
                <ButtonGroup>
                  <Button
                    size="sm"
                    radius="md"
                    color="success"
                    onClick={() => {
                      onClose;
                      updateRequestStatus(modalData._id, "Accepted");
                    }}
                    isDisabled={modalData.status === "Accepted"}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    radius="md"
                    color="danger"
                    onClick={() => {
                      onClose;
                      updateRequestStatus(modalData._id, "Denied");
                    }}
                    isDisabled={modalData.status === "Denied"}
                  >
                    Deny
                  </Button>
                </ButtonGroup>
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
