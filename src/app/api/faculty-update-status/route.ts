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
    const { id, status, session, facRemarks } = body as {
      id: string;
      status: string;
      session: any;
      facRemarks: string;
    };

    // Validate inputs
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!id || !status) {
      return new NextResponse(
        JSON.stringify({ error: "ID and status are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (typeof facRemarks !== "string") {
      return new NextResponse(
        JSON.stringify({ error: "Faculty remarks must be text" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize remarks - limit length and remove any problematic characters
    const sanitizedRemarks = facRemarks.slice(0, 500).trim();

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    // Get the makeup request first
    const request = await db
      .collection("makeup-requests")
      .findOne({ _id: new ObjectId(id) });

    if (!request) {
      return new NextResponse(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify faculty has permission to modify this request
    const faculty = await db
      .collection("ics")
      .findOne({ email: session.user.email });

    if (!faculty) {
      return new NextResponse(JSON.stringify({ error: "Faculty not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.courseCode !== faculty.courseCode) {
      return new NextResponse(
        JSON.stringify({ error: "Not authorized to modify this request" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if the current status is already Accepted, Denied, or faculty approved
    if (
      request.status === "Accepted" ||
      request.status === "Denied" ||
      request.status === "faculty approved"
    ) {
      return new NextResponse(
        JSON.stringify({
          error: `Request cannot be modified as it is already in ${request.status} status`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle based on evaluation component
    try {
      if (request.evalComponent === "Mid Semester Exam") {
        // Update request status
        await db
          .collection("makeup-requests")
          .updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, facRemarks: sanitizedRemarks } }
          );

        // Send email to student
        if (request.email) {
          await sendEmail(
            request.email,
            "Mid Semester Exam Makeup Request Status",
            `Your Mid Semester Exam Makeup Request has been ${status} by the faculty. ${
              sanitizedRemarks ? `Remarks: ${sanitizedRemarks}` : ""
            }`
          );
        }
      } else if (
        request.evalComponent === "Comprehensive Exam" ||
        request.evalComponent === "End Semester Exam"
      ) {
        if (status === "Accepted") {
          // Update with faculty approved status
          await db
            .collection("makeup-requests")
            .updateOne(
              { _id: new ObjectId(id) },
              {
                $set: {
                  status: "faculty approved",
                  facRemarks: sanitizedRemarks,
                },
              }
            );

          // Notify student of pending TTD approval
          if (request.email) {
            await sendEmail(
              request.email,
              "End Semester Exam Makeup Request Status Update",
              `Your End Semester Exam Makeup Request has been approved by faculty and is now pending TimeTable Division approval. ${
                sanitizedRemarks ? `Faculty remarks: ${sanitizedRemarks}` : ""
              }`
            );
          }

          // Notify TTD
          const ttdEmail = process.env.TTDEMAIL;
          if (ttdEmail) {
            await sendEmail(
              ttdEmail,
              "End Semester Exam Makeup Request Needs Review",
              `A makeup request for End Semester Exam has been approved by faculty and requires your review. Student: ${request.name}, ID: ${request.idNumber}, Course: ${request.courseCode}`
            );
          }
        } else if (status === "Denied") {
          // Update with rejected status
          await db
            .collection("makeup-requests")
            .updateOne(
              { _id: new ObjectId(id) },
              { $set: { status, facRemarks: sanitizedRemarks } }
            );

          // Notify student of rejection
          if (request.email) {
            await sendEmail(
              request.email,
              "End Semester Exam Makeup Request Status",
              `Your End Semester Exam Makeup Request has been ${status} by the faculty. ${
                sanitizedRemarks ? `Remarks: ${sanitizedRemarks}` : ""
              }`
            );
          }
        }
      } else {
        // For any other evaluative component
        await db
          .collection("makeup-requests")
          .updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, facRemarks: sanitizedRemarks } }
          );

        // Send email to student
        if (request.email) {
          await sendEmail(
            request.email,
            `${request.evalComponent} Makeup Request Status`,
            `Your ${
              request.evalComponent
            } Makeup Request has been ${status} by the faculty. ${
              sanitizedRemarks ? `Remarks: ${sanitizedRemarks}` : ""
            }`
          );
        }
      }

      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (dbError) {
      console.error("Database or email error:", dbError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to process request" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in PATCH route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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
