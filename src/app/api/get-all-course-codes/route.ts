import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const uniqueCourseCodes = await db.collection("ics").distinct("courseCode");

    if (uniqueCourseCodes.length === 0) {
      return NextResponse.json({ error: `No course codes found` }, { status: 404 });
    }

    return NextResponse.json({ courseCodes: uniqueCourseCodes }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
