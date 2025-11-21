import { MongoClient } from 'mongodb';

let client;
let db;

export async function connectDB() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('⚠️ MongoDB URI not found, using JSON file');
    return null;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('pergunu'); // database name
    console.log('✅ MongoDB connected');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return null;
  }
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDB() {
  return db;
}
