import { MongoClient, type Db } from 'mongodb';
import { MONGODB_DB_NAME, MONGODB_URI } from 'astro:env/server';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB_NAME);
  return db;
}

export const COMMENTS_COLLECTION = 'comments';
