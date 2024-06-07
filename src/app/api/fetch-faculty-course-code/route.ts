import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facultyEmail, session } = req.body as unknown as { facultyEmail: string; session: any };

    //TODO: Fix this error. Currently session shows undefined.
    // if (session) {
    //   return NextResponse.json({ error: `Unauthorized` }, { status: 400 });
    // }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const document = await db.collection("ics").findOne({ email: body.email });

    if (!document) {
      return NextResponse.json({ error: `Faculty not found with email: ${body.email}.`}, { status: 404 }); //shows undefined here
    }

    return NextResponse.json({ courseCode: document.courseCode }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
