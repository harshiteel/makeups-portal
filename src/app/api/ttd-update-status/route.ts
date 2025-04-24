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
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    // Get the makeup request first
    const request = await db
      .collection("makeup-requests")
      .findOne({ _id: new ObjectId(id) });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Verify faculty has permission to modify this request
    const admin = await db
      .collection("admins")
      .findOne({ email: session.user.email });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Handle based on evaluation component
    if (
      request.evalComponent === "Comprehensive Exam" &&
      request.status === "faculty approved"
    ) {
      // Update the request status
      await db
        .collection("makeup-requests")
        .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

      // Send email notification if email exists
      if (request.email) {
        try {
          await sendEmail(
            request.email,
            "Comprehensive Exam Makeup Request Status",
            `Your Comprehensive Exam Makeup Request has been ${status}. Faculty Remarks: ${
              request.facRemarks || "None"
            }`
          );
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
          // Continue with the request even if email fails
        }
      }

      // Return success response
      return NextResponse.json(
        {
          success: true,
          message: "Request status updated successfully",
        },
        { status: 200 }
      );
    } else {
      // Clear error message for different evaluation components
      let message = "";

      if (request.evalComponent !== "Comprehensive Exam") {
        message =
          "This feature is only available for Comprehensive Exam requests.";
      } else if (request.status !== "faculty approved") {
        message =
          "Only requests with 'faculty approved' status can be processed.";
      }

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in PATCH route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function for email sending with error handling
async function sendEmail(to: string, subject: string, text: string) {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text,
  });
}
