// src/app/api/fetch-makeup-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { courseCode, session } = req.body as unknown as { courseCode?: string; session: any };

    if (session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    let filter = {};
    if (courseCode) {
      filter = { courseCode };
    }

    const projection = {
      attachments: 0, // Exclude attributes starting with 'attachments'
    };

    const makeupRequests = await db
      .collection("makeup-requests")
      .find(filter)
      .project(projection)
      .toArray();

    return new NextResponse(JSON.stringify(makeupRequests), { status: 200 });
  } catch (error) {
    console.error("Error in POST route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
