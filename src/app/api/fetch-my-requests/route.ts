import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { email, session } = req.body as unknown as { email?: string; session: any };

    // if (!session) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const pipeline = [
      { $match: email },
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
