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
import FileIconSVG from '../../public/images/file-icon.svg'

const AdminDashboard = ({ searchTerm }) => {
  const { data: session } = useSession();
  const [makeupRequests, setMakeupRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");

  // Modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [scrollBehavior, setScrollBehavior] = React.useState("inside");
  const [modalData, setModalData] = React.useState(null);
  const [attachments, setAttachments] = React.useState([]);

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

  useEffect(() => {
    document.title = "Admin Dashboard | Makeups Portal";
    if (session) {
      fetchData(activeTab);
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
    <div className="flex flex-col items-center h-screen">
      <h1 className="font-semibold my-4 italic text-center">
        {session?.user?.name}'s Admin Dashboard
      </h1>

      <p className="italic font-sm">Click a row to open deatailed view</p>

      <Tabs
        className="flex items-center my-6 justify-center"
        activeKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key);
          fetchData(key);
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
          <TableColumn className="text-center">Status</TableColumn>
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
                      Status:
                    </h3>
                    <p className="text-base mb-0">{modalData.status}</p>
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
                              src={FileIconSVG}
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
              </ModalBody>

              {modalData.facRemarks && (
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold italic text-sm mb-0">
                    Faculty Remarks:
                  </h3>
                  <p className="text-base mb-0">{modalData.facRemarks}</p>
                </div>
              )}

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

export default AdminDashboard;
