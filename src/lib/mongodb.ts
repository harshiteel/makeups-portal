// src/lib/mongodb.ts
import { MongoClient } from 'mongodb';

declare global {
  // This is necessary to allow global variables in TypeScript
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
const options = {};

// Check the MongoClient instance to avoid creating multiple instances
let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the MongoClient instance is not re-created
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new MongoClient instance
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export the client promise to be used in other parts of the application
export default clientPromise;
