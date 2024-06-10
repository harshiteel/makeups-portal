import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) return new NextResponse("No Id provided", { status: 400 });

    let id = body.id;
    if (!(id instanceof ObjectId)) {
      id = new ObjectId(id);
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const documents = await db.collection("makeup-requests").findOne({ _id: id });

    if (!documents) return new NextResponse("Document not found", { status: 404 });

    const attachments = Object.entries(documents)
      .filter(([key, value]) => key.startsWith("attachment-"))
      .reduce((acc, [key, value]) => {
        const trimmedKey = key.replace("attachment-", ""); // Truncate 'attachment-' from key
        return { ...acc, [trimmedKey]: value };
      }, {});

    return new NextResponse(JSON.stringify(attachments), { status: 200 });
  } catch (error) {
    // console.error("Error in POST route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
