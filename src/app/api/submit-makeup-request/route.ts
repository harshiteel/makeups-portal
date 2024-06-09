import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI; 

export async function POST(request: NextRequest) {
  try {
    const client = new MongoClient(MONGO_URI || 'mongodb://localhost:27017');

    const data = await request.formData(); 
    const formData: any = {}; 

    for (const entry of data.entries()) {
      const key = entry[0];
      const value = entry[1];

      if (value instanceof File) {
        // If the value is a File, convert it to a base64 string
        const buffer = await value.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        formData[key] = base64;
      } else {
        // Otherwise, just add the value to the form data
        formData[key] = value;
      }
    }

    await client.connect();
    const database = client.db('ID-makeups');
    const collection = database.collection('makeup-requests'); 

    // Store formData in the MongoDB collection
    await collection.insertOne(formData);

    await client.close();

    return new NextResponse(JSON.stringify({ message: 'Success', data: formData }));
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse(JSON.stringify({ message: 'Error' }));
  }
}
