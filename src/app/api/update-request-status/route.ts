import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, session } = body as { id: string; status: string; session: any };

    // if (!session) {
    //     return new NextResponse("Unauthorized", { status: 401 });
    // }

    if (!body.id || !body.status) {
      return new NextResponse("ID and status are required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const result = await db.collection("makeup-requests").updateOne(
      { _id: new ObjectId(body.id) },
      { $set: { status: body.status } }
    );

    if (result.matchedCount === 0) {
      return new NextResponse("Request not found" + body, { status: 404 });
    }

    return new NextResponse("Request status updated successfully", { status: 200 });
  } catch (error) {
    console.error("Error in PATCH route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
