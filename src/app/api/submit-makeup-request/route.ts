import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

  // Now you can send formData to your MongoDB database
  // ...

  return new NextResponse(JSON.stringify({ message: 'Success' , data: formData}));
}
