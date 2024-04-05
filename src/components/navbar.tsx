import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import TDLogo from "../../public/images/tdlogo-01.png";
import Image from "next/image"

const Navbar: React.FC = () => {
    const { data: session, status } = useSession();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleModalToggle = () => {
        setIsModalOpen(!isModalOpen);
    };

    const signoutUser = async () =>{
        await signOut({ callbackUrl: "/" });
    }

    const handleMouseLeave = () => {
        setIsModalOpen(false);
    };

    const navToAccountSettings = (e:any) => {
        e.preventDefault();
        window.location.href = "/account";
    }

    return (
        <nav className="flex items-center justify-between bg-gray-800 text-white p-4">
            <div className="flex items-center">
                <Image src={TDLogo} alt="TD" height={32}/>
                <h1 className="ml-2 text-lg font-semibold">Makeups Portal</h1>
            </div>
            <div className="flex items-center relative">
                <img
                    src={session?.user?.image || ""}
                    alt="User Profile"
                    className="h-8 w-8 rounded-full cursor-pointer"
                    onClick={handleModalToggle}
                />
                {isModalOpen && (
                    <div className="absolute right-0 top-12 text-black mr-4 bg-white p-4 rounded shadow" onMouseLeave={handleMouseLeave}>
                        <ul>
                            <li>
                                <button onClick={signoutUser} className="block rounded w-full text-sm text-left py-2 px-4 hover:bg-red-400" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Sign Out
                                </button>
                            </li>
                            <li>
                                <button onClick={navToAccountSettings} className="block rounded w-full text-sm text-left py-2 px-4 hover:bg-gray-200" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Account Settings
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;