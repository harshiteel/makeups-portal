import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email: string };

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const admin = await db.collection("admins").findOne({ email });
    const faculty = await db.collection("ics").findOne({ email });

    if (admin) {
      return new NextResponse(JSON.stringify({ accountType: "admin" }), { status: 200 });
    } else if (faculty) {
      return new NextResponse(JSON.stringify({ accountType: "faculty" }), { status: 200 });
    } else {
      return new NextResponse(JSON.stringify({ accountType: "student" }), { status: 200 });
    }
  } catch (error) {
    console.error("Error in POST route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
