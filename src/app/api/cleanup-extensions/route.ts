import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ID-makeups");

    // Deactivate expired extensions
    const result = await db.collection("temp-extensions").updateMany(
      {
        isActive: true,
        extendedUntil: { $lt: new Date() }
      },
      {
        $set: {
          isActive: false,
          autoClosedAt: new Date(),
          autoClosedReason: "Extension period expired"
        }
      }
    );

    console.log(`Cleanup: ${result.modifiedCount} expired extensions deactivated`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} expired extensions`,
      cleanedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Error in cleanup:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}