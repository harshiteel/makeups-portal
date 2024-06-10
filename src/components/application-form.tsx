"use client";

import { useEffect, useState } from "react";
import { Textarea, Card, CardBody } from "@nextui-org/react";
import { useDropzone } from "react-dropzone";
import Select from "react-select";
import Image from "next/image";

interface ApplicationFormProps {
  user: string;
  email: string;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ user, email }) => {
  const [idNumber, setIdNumber] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [evalComponent, setEvalComponent] = useState("");
  const [reason, setReason] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [courseCodes, setCourseCodes] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleImageDrop = (acceptedFiles: File[]) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    const oversizedFiles: File[] = [];
    const validFiles: File[] = [];

    acceptedFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        oversizedFiles.push(file);
      } else if (allowedTypes.includes(file.type)) {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      setErrorMsg("Please compress attachments exceeding 5MB and reupload.");
    }

    if (validFiles.length > 0) {
      setAttachments((prevAttachments) => [...prevAttachments, ...validFiles]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    maxSize: 5 * 1024 * 1024, // 5MB in bytes
    onDrop: (acceptedFiles) => handleImageDrop(acceptedFiles),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!idNumber || !courseCode || !evalComponent || !reason) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    const formData = new FormData();
    const submissionTime = new Date().toISOString();

    try {
      formData.append("name", user);
      formData.append("idNumber", idNumber);
      formData.append("email", email);
      formData.append("courseCode", courseCode);
      formData.append("evalComponent", evalComponent);
      formData.append("reason", reason);
      attachments.forEach((file) => {
        formData.append(`attachment-${file.name}`, file);
      });
      formData.append("submission-time", submissionTime);
      formData.append("status", "Pending");

      const response = await fetch("/api/submit-makeup-request", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        alert(
          "Your Makeup request has been successfully submitted to your course IC. Please keep checking your dashboard for updates."
        );
        window.location.reload();
      }
    } catch (error) {
      alert(
        "An error has occurred while submitting your request, please try again later. If the issue persists, contact TimeTable Division."
      );
    }
  };

  const getCourseCodes = async () => {
    try {
      const response = await fetch("/api/get-all-course-codes", {
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
      alert("Error fetching course codes");
    }
  };

  useEffect(() => {
    getCourseCodes();
  }, []);

  const courseOptions = courseCodes.map((cc) => ({
    value: cc,
    label: cc,
  }));

  const deleteFile = (fileName: string) => {
    const updatedAttachments = attachments.filter(
      (file) => file.name !== fileName
    );
    setAttachments(updatedAttachments);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="py-8 px-6 md:px-10">
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-center">
            Makeup Exam Application
          </h1>
          {errorMsg && (
            <p className="text-red-500 mb-4 text-center">{errorMsg}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <label htmlFor="name" className="font-semibold">
                Name:
              </label>
              <p className="text-sm md:text-base font-semibold">{user}</p>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <label htmlFor="email" className="font-semibold">
                Email:
              </label>
              <p className="text-sm md:text-base italics">{email}</p>
            </div>

            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <label htmlFor="idNumber" className="font-semibold">
                ID Number:
              </label>
              <input
                required
                type="text"
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <label htmlFor="courseCode" className="font-semibold">
                Course Code:
              </label>
              <div className="w-full md:w-1/2">
                <Select
                  options={courseOptions}
                  onChange={(option) => setCourseCode(option?.value || "")}
                  placeholder="Type to search..."
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <label htmlFor="evalComponent" className="font-semibold">
                Evaluative Component:
              </label>
              <input
                required
                type="text"
                id="evalComponent"
                value={evalComponent}
                onChange={(e) => setEvalComponent(e.target.value)}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
                placeholder="Eg: Quiz 1"
              />
            </div>

            <div className="flex flex-col items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <label htmlFor="reason" className="font-semibold">
                Reason
              </label>
              <Textarea
                required
                placeholder="Please provide a reason for your makeup."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>

            <div
              {...getRootProps()}
              className="flex flex-col items-center space-y-8 py-4 md:space-y-0 md:space-x-4 mb-4 border border-dashed border-gray-300 rounded-md"
            >
              <input {...getInputProps()} />
              <p className="font-semibold">
                Attach your prescriptions, etc here (max 5MB each){" "}
              </p>
              <p className="text-red-500">
                <i className="text-small">
                  (Allowed File Types: PDF, PNG, JPG, JPEG)
                </i>
              </p>
            </div>

            <div className="flex flex-col my-4">
              {attachments.map((file) => {
                return (
                  <div
                    key={file.name}
                    className="flex flex-col items-start mx-8 my-2"
                  >
                    <Card>
                      <CardBody className="flex flex-row items-start justify-center my-auto">
                        <Image
                          src="/images/file-icon.svg"
                          width={24}
                          height={24}
                          alt=""
                        />
                        <div className="flex flex-col">
                          <p className="text-md mx-6">{file.name}</p>
                          <p className={`text-sm mx-6 italic`}>
                            Size: {(file.size / 1048576).toFixed(2)} MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteFile(file.name)}
                          className="text-black-500 mx-6"
                        >
                          ❌
                        </button>
                      </CardBody>
                    </Card>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-400"
            >
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
