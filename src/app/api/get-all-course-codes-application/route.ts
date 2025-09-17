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

    // Calculate two days from now in IST (submission deadline boundary)
    const twoDaysFromNowIST = new Date(currentDateIST.getTime() + (2 * 24 * 60 * 60 * 1000));
    console.log("Two days from now in IST:", twoDaysFromNowIST);

    // Since compreDate and midsemDate are stored in IST format (DD-MM-YYYY), but MongoDB's $dateFromString 
    // treats it as UTC, we need to adjust by subtracting IST offset to get correct comparison
    const twoDaysFromNowAdjustedForMongoDB = new Date(twoDaysFromNowIST.getTime() - istOffset);
    console.log("Two days from now adjusted for MongoDB UTC parsing:", twoDaysFromNowAdjustedForMongoDB);

    const validDocuments = await db.collection("ics").find({
      $expr: {
        $or: [
          {
            $and: [
              { $ne: ["$compreDate", null] },
              { $ne: ["$compreDate", ""] },
              {
                $gt: [
                  { $dateFromString: { dateString: "$compreDate", format: "%d-%m-%Y" } },
                  twoDaysFromNowAdjustedForMongoDB
                ]
              }
            ]
          },
          {
            $and: [
              { $ne: ["$midsemDate", null] },
              { $ne: ["$midsemDate", ""] },
              {
                $gt: [
                  { $dateFromString: { dateString: "$midsemDate", format: "%d-%m-%Y" } },
                  twoDaysFromNowAdjustedForMongoDB
                ]
              }
            ]
          }
        ]
      }
    }).toArray();

    // Also get courses with active temporary extensions
    const activeExtensions = await db.collection("temp-extensions").find({
      isActive: true,
      extendedUntil: { $gt: currentDateIST }
    }).toArray();

    // Get course codes from extensions
    const extensionCourseCodes = activeExtensions.map(ext => ext.courseCode);

    // Get courses that have active extensions (even if deadline passed)
    const extensionCourses = await db.collection("ics").find({
      courseCode: { $in: extensionCourseCodes }
    }).toArray();

    // Combine regular valid documents with extension courses
    const allValidDocuments = [...validDocuments];
    extensionCourses.forEach(course => {
      // Only add if not already included
      if (!allValidDocuments.find(doc => doc.courseCode === course.courseCode)) {
        allValidDocuments.push(course);
      }
    });

    console.log("Valid documents fetched:", allValidDocuments.length);
    console.log("Extension courses added:", extensionCourses.length);

    const validCourseCodes = [...new Set(allValidDocuments.map(doc => doc.courseCode))];
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

// FIXED: Valid docs are now correctly filtered to courses whose submission deadline hasn't passed
// Logic: Students can submit makeup requests up to 2 days before exam date (compre OR midsem)
// So valid courses = courses with either compreDate > (current date + 2 days) OR midsemDate > (current date + 2 days)
// This ensures students can only see courses they can still apply for (for either exam type)