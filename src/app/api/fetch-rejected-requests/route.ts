import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { courseCode, session } = req.body as unknown as { courseCode?: string; session: any };

    // if (!session) {
    //   console.log(session);
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    let filter: any = { status: "Denied" }; 
    if (courseCode) {
      filter.courseCode = courseCode; 
    }

    const pipeline = [
      { $match: filter }, 
      {
        $addFields: {
          tempArray: { $objectToArray: "$$ROOT" }
        }
      },
      {
        $addFields: {
          filteredArray: {
            $filter: {
              input: "$tempArray",
              as: "item",
              cond: { $not: [{ $regexMatch: { input: "$$item.k", regex: "^attachment" } }] }
            }
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: { $arrayToObject: "$filteredArray" }
        }
      }
    ];

    const makeupRequests = await db.collection("makeup-requests").aggregate(pipeline).toArray();

    return new NextResponse(JSON.stringify(makeupRequests), { status: 200 });
  } catch (error) {
    console.error("Error in POST route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
