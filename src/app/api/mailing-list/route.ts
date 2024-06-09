import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      throw new Error("Email parameter is missing");
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const isInExcludedMailingList = await db
      .collection("excluded-mailing-list")
      .findOne({ email });

    const message = isInExcludedMailingList ? "no send mails" : "yes send mails";

    return new NextResponse(JSON.stringify({ message }), { status: 200 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: error }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email) {
      throw new Error("Email parameter is missing");
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    const alreadySubscribed = await db.collection("excluded-mailing-list").findOne({ email });
    if(!alreadySubscribed){
      await db.collection("excluded-mailing-list").insertOne({ email });
    }

    return new NextResponse(JSON.stringify({ message: "You have been unsubscribed from our mailing list." }), { status: 200 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: "Error: " + error }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      throw new Error("Email parameter is missing");
    }

    const client = await clientPromise;
    const db = client.db("ID-makeups");

    await db.collection("excluded-mailing-list").deleteOne({ email });

    return new NextResponse(JSON.stringify({ message: "You have been subscribed to our mailing list. Keep looking your BITS mail for updates" }), { status: 200 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: "Error: " + error }), { status: 500 });
  }
}
