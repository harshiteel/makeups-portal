import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  let client;
  try {
    const body = await req.json();
    console.log('fetch-requests body:', body); // Debug log
    console.log('fetch-requests timestamp:', new Date().toISOString()); // Debug log

    let filter: any = {};
    if (body) {
      if (body.status) {
        filter.status = body.status;
      }
      if (body.courseCode) {
        filter.courseCode = body.courseCode;
      }
    }
    console.log('fetch-requests filter:', filter); // Debug log

    client = await clientPromise;
    const db = client.db("ID-makeups");

    // Force a fresh connection by pinging the database
    await db.admin().ping();
    console.log('Database ping successful'); // Debug log

    // First, let's see what's actually in the database
    const allRequests = await db.collection("makeup-requests").find({}).toArray();
    console.log('Total requests in database:', allRequests.length); // Debug log
    console.log('All requests:', allRequests.map(r => ({ _id: r._id, courseCode: r.courseCode, status: r.status, email: r.email }))); // Debug log

    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          tempArray: { $objectToArray: "$$ROOT" },
        },
      },
      {
        $addFields: {
          filteredArray: {
            $filter: {
              input: "$tempArray",
              as: "item",
              cond: { $not: [{ $regexMatch: { input: "$$item.k", regex: "^attachment" } }] },
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: { $arrayToObject: "$filteredArray" },
        },
      },
    ];

    const makeupRequests = await db.collection("makeup-requests").aggregate(pipeline).toArray();
    console.log('fetch-requests results count:', makeupRequests.length); // Debug log
    console.log('fetch-requests sample result:', makeupRequests[0]); // Debug log

    return NextResponse.json(makeupRequests, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Error in POST route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
