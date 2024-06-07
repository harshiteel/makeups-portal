// import { getSession, useSession } from "next-auth/react";
// import { NextRequest } from "next/server";

// interface AuthResult {
//   status: "unauthenticated" | "authenticated" | "error";
//   session?: any; // Update this to the actual session type
// }

// export const authMiddleware = async (req: NextRequest): Promise<AuthResult> => {
//   try {
//     // const session = await getSession({ req: req as any });
//     const { data: session, status } = useSession();
//     if (!session) {
//       return { status: "unauthenticated" };
//     }

//     return { status: "authenticated", session };
//   } catch (error) {
//     console.error("Error in authMiddleware:", error);
//     return { status: "error" };
//   }
// };
