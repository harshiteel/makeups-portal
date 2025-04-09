import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
})
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, session, facRemarks } = body as { id: string; status: string; session: any; facRemarks: any };

    if (!session) {
       return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!id || !status) {
      return new NextResponse("ID and status are required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const result = await db.collection("makeup-requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status, facRemarks: facRemarks } }
    );
    if (result.matchedCount === 0) {
      return new NextResponse("Request not found" + body, { status: 404 });
    }
    const request = await db.collection("makeup-requests").findOne({ _id: new ObjectId(id) }) ;

    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: request?.email,
      subject: `Your makeup request has been ${status}`,
      text: `Your makeup request has been ${status}. Please check the portal for more details.`,
    })

    console.log(info)
    return new NextResponse("Request status updated successfully", { status: 200 });
  } catch (error) {
    console.error("Error in PATCH route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

