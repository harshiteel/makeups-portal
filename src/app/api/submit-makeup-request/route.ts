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
    const evalComponent = data.get('evalComponent') as string;
    console.log('Course code:', courseCode); // Debug point
    console.log('Evaluation component:', evalComponent); // Debug point

    if (!courseCode) {
      console.log('Error: Course code is missing'); // Debug point
      return new NextResponse(JSON.stringify({ 
        message: 'Error: Course code is required' 
      }), { status: 400 });
    }

    if (!evalComponent) {
      console.log('Error: Evaluation component is missing'); // Debug point
      return new NextResponse(JSON.stringify({ 
        message: 'Error: Evaluation component is required' 
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
    const midsemDate = courseInfo.midsemDate;
    console.log('Compre date (already in IST):', compreDate); // Debug point
    console.log('Midsem date (already in IST):', midsemDate); // Debug point

    // Determine which exam date to check based on evalComponent
    let examDate: string;
    if (evalComponent === "Comprehensive Exam") {
      examDate = compreDate;
    } else if (evalComponent === "Mid Semester Exam") {
      examDate = midsemDate;
    } else {
      console.log('Error: Invalid evaluation component'); // Debug point
      await client.close();
      return new NextResponse(JSON.stringify({
        message: 'Error: Invalid evaluation component'
      }), { status: 400 });
    }

    if (!examDate) {
      console.log(`Error: ${evalComponent} date not found for this course`); // Debug point
      await client.close();
      return new NextResponse(JSON.stringify({
        message: `Error: ${evalComponent} date not found for this course`
      }), { status: 400 });
    }

    // Convert current time to IST (UTC+5:30)
    const currentDateUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const currentDate = new Date(currentDateUTC.getTime() + istOffset);
    console.log('Current date (IST):', currentDate); // Debug point

    // Parse examDate string (already stored in IST timezone)
    const [day, month, year] = examDate.split('-').map(Number);
    const examDateIST = new Date(year, month - 1, day); // month is 0-indexed, date is already in IST
    console.log(`${evalComponent} date parsed (IST):`, examDateIST); // Debug point

    // Calculate submission deadline (2 days before exam date, both in IST)
    const submissionDeadline = new Date(examDateIST.getTime() - (2 * 24 * 60 * 60 * 1000));
    console.log('Submission deadline (IST):', submissionDeadline); // Debug point

    // For comparison, use date-only (set time to start of day) to avoid time-of-day issues
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const deadlineOnly = new Date(submissionDeadline.getFullYear(), submissionDeadline.getMonth(), submissionDeadline.getDate());
    
    console.log('Current date (date only):', currentDateOnly); // Debug point
    console.log('Deadline (date only):', deadlineOnly); // Debug point

    // Check for temporary admin extension before validating deadline
    const examTypeForExtension = evalComponent === "Comprehensive Exam" ? "compre" : "midsem";
    
    // Use UTC date for comparison with MongoDB stored dates (which are in UTC)
    const currentDateUTCForExtension = new Date();
    console.log('Current UTC date for extension check:', currentDateUTCForExtension); // Debug point
    console.log('Looking for extension with courseCode:', courseCode, 'examType:', examTypeForExtension); // Debug point
    
    const tempExtension = await database.collection("temp-extensions").findOne({
      courseCode: courseCode,
      examType: examTypeForExtension,
      isActive: true,
      extendedUntil: { $gt: currentDateUTCForExtension }
    });

    console.log('Temporary extension found:', tempExtension); // Debug point

    // Compare current date with submission deadline (both as date-only)
    if (currentDateOnly > deadlineOnly && !tempExtension) {
      console.log('Error: Submission deadline has passed and no temporary extension active'); // Debug point
      await client.close();
      return new NextResponse(JSON.stringify({
        message: `Error: Submission deadline has passed for ${evalComponent} of this course`
      }), { status: 403 });
    }

    if (tempExtension) {
      console.log('Submission allowed due to temporary admin extension'); // Debug point
      // Add extension info to form data for tracking
      formData.submittedViaExtension = {
        extensionId: tempExtension._id,
        adminEmail: tempExtension.adminEmail,
        extendedUntil: tempExtension.extendedUntil
      };
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

    // Set default status and submission time (store actual UTC time)
    formData.status = 'Pending';
    formData['submission-time'] = new Date().toISOString();

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