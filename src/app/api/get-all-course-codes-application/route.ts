import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ID-makeups");
    
    const currentDate = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(currentDate.getDate() - 2);
    
    const validDocuments = await db.collection("ics").find({
      compreDate: { $gte: twoDaysAgo }
    }).toArray();
    
    const validCourseCodes = [...new Set(validDocuments.map(doc => doc.courseCode))];
    
    if (validCourseCodes.length === 0) {
      return NextResponse.json({ error: "No valid course codes found" }, { status: 404 });
    }
    
    return NextResponse.json({ courseCodes: validCourseCodes }, { status: 200 });

  } catch (error) {
    console.error("Error fetching course codes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}