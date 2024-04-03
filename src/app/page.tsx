import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 text-black flex-col">
      {/* Logo and title section */}
      <div className="w-64 h-64 relative mr-4 left-8">
        <Image
          src="/images/tdlogo-01.png"
          alt="TD Logo"
          layout="fill"
          objectFit="contain"
        />
      </div>
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold">Makeups Portal</h1>
        <p className="text-lg">
          Managed By TimeTable Division, BITS Pilani Hyderabad Campus
        </p>
      </div>

      {/* Auth buttons section */}
      <div className="flex flex-col space-y-4 items-center my-8">
        <button className="bg-blue-500 w-1/4 hover:bg-blue-600 text-white flex items-center justify-center mx-6 py-2 px-4 rounded-lg shadow-lg transition duration-300">
          <Image
            src="/images/professor.png"
            alt="Prof"
            width={32}
            height={32}
            objectFit="contain"
            className="mr-2"
          />
          <h3 className="text-lg font-medium">Faculty Login</h3>
        </button>
        <button className="bg-green-500 w-1/4 hover:bg-green-600 text-white flex items-center justify-center mx-6 py-2 px-4 rounded-lg shadow-lg transition duration-300">
          <Image
            src="/images/student.png"
            alt="Student"
            width={32}
            height={32}
            objectFit="contain"
            className="mr-2"
          />
          <h3 className="text-lg font-medium">Student Login</h3>
        </button>
      </div>
    </main>
  );
}
