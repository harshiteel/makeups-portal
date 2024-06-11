import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Binary } from "mongodb";

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

    const document = await db.collection("makeup-requests").findOne({ _id: id });

    if (!document) return new NextResponse("Document not found", { status: 404 });

    const attachments = Object.entries(document)
      .filter(([key, value]) => value && value.data instanceof Binary)
      .reduce((acc, [key, value]) => {
        const buffer = value.data.buffer;
        const base64 = buffer.toString('base64');
        return { ...acc, [key]: { data: base64, mimeType: value.mimeType } };
      }, {});

    return new NextResponse(JSON.stringify(attachments), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
