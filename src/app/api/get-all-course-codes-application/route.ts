import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    console.log("POST request received at /get-all-course-codes-application");

    const client = await clientPromise;
    console.log("MongoDB client connected");

    const db = client.db("ID-makeups");
    console.log("Database selected: ID-makeups");

    const currentDate = new Date();
    console.log("Current date:", currentDate);

    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const currentDateIST = new Date(currentDate.getTime() + istOffset);
    console.log("Current date in IST:", currentDateIST);

    // Calculate two days ago in IST
    const twoDaysAgoIST = new Date(currentDateIST.getTime() - (2 * 24 * 60 * 60 * 1000));
    console.log("Two days ago in IST:", twoDaysAgoIST);

    const validDocuments = await db.collection("ics").find({
      $expr: {
        $gte: [
          { $dateFromString: { dateString: "$compreDate", format: "%d-%m-%Y" } },
          twoDaysAgoIST
        ]
      }
    }).toArray();
    console.log("Valid documents fetched:", validDocuments);

    const validCourseCodes = [...new Set(validDocuments.map(doc => doc.courseCode))];
    console.log("Valid course codes extracted:", validCourseCodes);

    if (validCourseCodes.length === 0) {
      console.warn("No valid course codes found");
      return NextResponse.json({ error: "No valid course codes found" }, { status: 404 });
    }

    console.log("Returning valid course codes");
    return NextResponse.json({ courseCodes: validCourseCodes }, { status: 200 });

  } catch (error) {
    console.error("Error fetching course codes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}