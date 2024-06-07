import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { facultyEmail, session } = req.body as unknown as { facultyEmail?: string; session: any };

    if (!facultyEmail || !session) {
      return new NextResponse("Faculty email and session are required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const document = await db.collection("ics").findOne({ email: facultyEmail });

    if (!document) {
      return new NextResponse("Faculty not found", { status: 404 });
    }

    return new NextResponse(JSON.stringify({ courseCode: document.courseCode }), { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
