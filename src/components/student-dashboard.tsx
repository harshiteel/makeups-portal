import { useEffect, useState } from "react";
;

const StudentDashboard = ({ user }: { user: string }) => {

  const [idNumber, setIdNumber] = useState("");
  const [courseCode, setCourseCode] = useState("");
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

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log("u", user);
    console.log({ idNumber, courseCode, reason, images });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 items-center justify-center text-center flex">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to the Dashboard!
            </h1>
            <p className="mt-2 text-gray-600">This is the dashboard content.</p>

          </div>
        </div>
      </div>
      <div className="max-w-md mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4">Makeup Exam Application</h1>
        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
        <form onSubmit={handleSubmit}>
          <h3>Name: {user}</h3>
          <div className="mb-4">
            <label htmlFor="idNumber" className="block mb-1">
              ID Number
            </label>
            <input
              type="text"
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="courseCode" className="block mb-1">
              Course Code
            </label>
            <input
              type="text"
              id="courseCode"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="reason" className="block mb-1">
              Reason
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring focus:ring-blue-400"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="images" className="block mb-1">
              Image Uploads (max 5MB each)
            </label>
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
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-400"
          >
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
