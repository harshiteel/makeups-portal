import { useState } from "react";
import { Textarea } from "@nextui-org/react";

const ApplicationForm = ({ user }: { user: string }) => {
  const [idNumber, setIdNumber] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [evalComponent, setEvalComponent] = useState("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];

    // Check if file size exceeds 5MB
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "0", 10);
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setErrorMsg("Please compress images exceeding 5MB");
      return;
    }

    setErrorMsg("");

    const imagePromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64Image = reader.result as string;
          resolve(base64Image);
        };
        reader.onerror = (error) => reject(error);
      });
    });

    Promise.all(imagePromises)
      .then((base64Images) => {
        setImages((prevImages) => [...prevImages, ...(base64Images as any)]);
      })
      .catch((error) => {
        console.error("Error converting images to base64:", error);
      });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("u", user);
    console.log({ idNumber, courseCode, reason, images });
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
              <input
                required
                type="text"
                id="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
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
                placeholder="Please provide a valid reason for your application."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col items-center space-y-8 py-4 md:space-y-0 md:space-x-4 mb-4">
              <label htmlFor="images" className="font-semibold">
                Image Uploads (max 5MB each)
              </label>
              <p className=" text-red-500">
                Attach your prescriptions, etc here.{" "}
                <i className=" text-small">(PDF, PNG, JPG, JPEG)</i>
              </p>
              <input
                type="file"
                id="images"
                accept=".jpg, .jpeg, .png, .pdf"
                multiple
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
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
