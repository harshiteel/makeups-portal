import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, courseCode, examType, session } = body;

    // Validate admin authentication
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // TODO: Add admin role validation here
    // For now, assuming all authenticated users can perform admin actions
    // You might want to check against an admin list or role field

    const client = await clientPromise;
    const db = client.db("ID-makeups");
    
    if (action === "extend") {
      // Create or update temporary extension
      const extensionData = {
        courseCode,
        examType, // "compre" or "midsem"
        adminEmail: session.user.email,
        extendedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        createdAt: new Date(),
        isActive: true
      };

      await db.collection("temp-extensions").replaceOne(
        { courseCode, examType },
        extensionData,
        { upsert: true }
      );

      console.log(`Temporary extension created for ${courseCode} ${examType} by ${session.user.email}`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Temporary extension activated for ${courseCode} ${examType}. Valid for 10 minutes.`,
        extendedUntil: extensionData.extendedUntil
      });

    } else if (action === "close") {
      // Close/deactivate temporary extension
      await db.collection("temp-extensions").updateOne(
        { courseCode, examType },
        { 
          $set: { 
            isActive: false, 
            closedAt: new Date(),
            closedBy: session.user.email
          } 
        }
      );

      console.log(`Temporary extension closed for ${courseCode} ${examType} by ${session.user.email}`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Temporary extension closed for ${courseCode} ${examType}.`
      });

    } else if (action === "status") {
      // Check current extension status
      const extension = await db.collection("temp-extensions").findOne({
        courseCode,
        examType,
        isActive: true,
        extendedUntil: { $gt: new Date() }
      });

      return NextResponse.json({
        success: true,
        hasActiveExtension: !!extension,
        extension: extension || null
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in admin temp extension:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = JSON.parse(searchParams.get('session') || '{}');

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    // Get all active extensions
    const activeExtensions = await db.collection("temp-extensions").find({
      isActive: true,
      extendedUntil: { $gt: new Date() }
    }).toArray();

    return NextResponse.json({
      success: true,
      activeExtensions
    });

  } catch (error) {
    console.error("Error fetching active extensions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}