import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, session } = body;

    // Check if the user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = email || session.user.email;

    let client: MongoClient | null = null;

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("ID-makeups");
    const ics = db.collection("ics");

    const faculty = await ics.findOne({ email: userEmail });

    if (!faculty) {
      await client.close();
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    await client.close();
    return NextResponse.json({ courseCode: faculty.courseCode });
  } catch (error) {
    console.error("Error fetching faculty course code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}