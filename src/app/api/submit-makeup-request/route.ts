import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Binary } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI; 

export async function POST(request: NextRequest) {
  try {
    console.log('Starting POST request handler'); // Debug point

    const client = new MongoClient(MONGO_URI || 'mongodb://localhost:27017');
    console.log('MongoDB client initialized'); // Debug point

    const data = await request.formData();
    console.log('Form data received:', data); // Debug point

    const formData: any = {};

    const courseCode = data.get('courseCode');
    console.log('Course code:', courseCode); // Debug point

    if (!courseCode) {
      console.log('Error: Course code is missing'); // Debug point
      return new NextResponse(JSON.stringify({ 
        message: 'Error: Course code is required' 
      }), { status: 400 });
    }

    const database = client.db('ID-makeups');
    const icsCollection = database.collection('ics');
    console.log('Connected to database and collection'); // Debug point

    const courseInfo = await icsCollection.findOne({ courseCode });
    console.log('Course info:', courseInfo); // Debug point

    if (!courseInfo) {
      console.log('Error: Invalid course code'); // Debug point
      await client.close();
      return new NextResponse(JSON.stringify({ 
        message: 'Error: Invalid course code' 
      }), { status: 400 });
    }

    const compreDate = courseInfo.compreDate;
    console.log('Compre date:', compreDate); // Debug point

    // Convert current time to IST (UTC+5:30)
    const currentDateUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const currentDate = new Date(currentDateUTC.getTime() + istOffset);
    console.log('Current date (IST):', currentDate); // Debug point

    // Parse compreDate string and convert to IST
    const [day, month, year] = compreDate.split('-').map(Number);
    const compreDateIST = new Date(year, month - 1, day); // month is 0-indexed
    console.log('Compre date (IST):', compreDateIST); // Debug point

    // Calculate submission deadline (2 days before compre date in IST)
    const submissionDeadline = new Date(compreDateIST.getTime() - (2 * 24 * 60 * 60 * 1000));
    console.log('Submission deadline (IST):', submissionDeadline); // Debug point

    if (currentDate > submissionDeadline) {
      console.log('Error: Submission deadline has passed'); // Debug point
      await client.close();
      return new NextResponse(JSON.stringify({
        message: 'Error: Submission deadline has passed for this course'
      }), { status: 403 });
    }

    for (const entry of data.entries()) {
      const key = entry[0];
      const value = entry[1];
      console.log(`Processing form entry: ${key}`); // Debug point

      if (value instanceof File) {
        const buffer = await value.arrayBuffer();
        const binData = new Binary(new Uint8Array(buffer));
        console.log(`File processed for key: ${key}`); // Debug point

        formData[key] = {
          data: binData,
          mimeType: value.type, 
        };
      } else {
        formData[key] = value;
      }
    }

    // Set default status and submission time in IST
    formData.status = 'Pending';
    const submissionTimeIST = new Date(new Date().getTime() + istOffset);
    formData['submission-time'] = submissionTimeIST.toISOString();

    const makeupCollection = database.collection('makeup-requests');
    console.log('Inserting form data into makeup-requests collection'); // Debug point
    await makeupCollection.insertOne(formData);

    await client.close();
    console.log('MongoDB client closed'); // Debug point

    return new NextResponse(JSON.stringify({ message: 'Success', data: formData }), { status: 200 });
  } catch (error) {
    console.error('Error:', error); // Debug point
    return new NextResponse(JSON.stringify({ message: 'Error' }), { status: 500 });
  }
}