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
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, session } = body as {
      id: string;
      status: string;
      session: any;
    };

    // Validate inputs
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: "Authentication required" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!id || !status) {
      return new NextResponse(JSON.stringify({ error: "ID and status are required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const client = await clientPromise;
    const db = client.db("ID-makeups");
    
    // Get the makeup request first
    const request = await db.collection("makeup-requests").findOne({ _id: new ObjectId(id) });
    
    if (!request) {
      return new NextResponse(JSON.stringify({ error: "Request not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify faculty has permission to modify this request
    const admin = await db.collection("admins").findOne({ email: session.user.email });
    
    if (!admin) {
      return new NextResponse(JSON.stringify({ error: "Admin not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    // Handle based on evaluation component
    try {
      if (request.evalComponent === "Comprehensive Exam" && status === "faculty approved") {
        await db.collection("makeup-requests").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        if (request.email) {
          await sendEmail(
            request.email,
            "Comprehensive Exam Makeup Request Status",
            `Your Comprehensive Exam Makeup Request has been ${status} . Faculty Remarks: ${request.facRemarks}`
          );
        }
      } else {
        return new NextResponse(JSON.stringify({ message: "No action taken for non-Comprehensive Exam requests or any requests rejected by the faculty. " }))
      }
    } catch (dbError) {
      console.error("Database or email error:", dbError);
      return new NextResponse(JSON.stringify({ error: "Failed to process request" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error in PATCH route:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Helper function for email sending with error handling
async function sendEmail(to: string, subject: string, text: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text,
    });
  } catch (emailError) {
    console.error("Failed to send email:", emailError);
    // Continue with the request even if email fails
  }
}