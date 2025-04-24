import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Binary } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI; 

export async function POST(request: NextRequest) {
  try {
    const client = new MongoClient(MONGO_URI || 'mongodb://localhost:27017');
    const data = await request.formData();
    const formData: any = {};

    const courseCode = data.get('courseCode');
    if (!courseCode) {
      return new NextResponse(JSON.stringify({ 
        message: 'Error: Course code is required' 
      }), { status: 400 });
    }

    const database = client.db('ID-makeups');
    const icsCollection = database.collection('ics');
    const courseInfo = await icsCollection.findOne({ courseCode });

    if (!courseInfo) {
      await client.close();
      return new NextResponse(JSON.stringify({ 
        message: 'Error: Invalid course code' 
      }), { status: 400 });
    }

    const compreDate = courseInfo.compreDate;
    const currentDate = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(currentDate.getDate() - 2);

    if (compreDate < twoDaysAgo) {
      await client.close();
      return new NextResponse(JSON.stringify({
        message: 'Error: Submission deadline has passed for this course'
      }), { status: 403 });
    }

    for (const entry of data.entries()) {
      const key = entry[0];
      const value = entry[1];

      if (value instanceof File) {
        const buffer = await value.arrayBuffer();
        const binData = new Binary(new Uint8Array(buffer));
      
        formData[key] = {
          data: binData,
          mimeType: value.type, 
        };
      } else {
        formData[key] = value;
      }
    }
    const makeupCollection = database.collection('makeup-requests');
    await makeupCollection.insertOne(formData);

    await client.close();

    return new NextResponse(JSON.stringify({ message: 'Success', data: formData }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse(JSON.stringify({ message: 'Error' }), { status: 500 });
  }
}