import type { ObjectId } from 'mongodb';
import { COMMENTS_COLLECTION, getDb } from './mongodb';
import type { DeviceMeta } from './device';

export type CommentCategory =
  | ''
  | 'accessibility'
  | 'content'
  | 'visual-design'
  | 'bug';

export type PortfolioComment = {
  _id?: ObjectId;
  pageUrl: string;
  selector: string;
  elementLabel: string;
  elementDisplayName?: string;
  category: CommentCategory;
  comment: string;
  createdAt: Date;
  deviceType: DeviceMeta['deviceType'];
  os: DeviceMeta['os'];
  viewportWidth: number;
};

export async function insertComment(
  input: Omit<PortfolioComment, '_id' | 'createdAt'>,
): Promise<string> {
  const database = await getDb();
  const result = await database.collection<PortfolioComment>(COMMENTS_COLLECTION).insertOne({
    ...input,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function listComments(limit = 200): Promise<PortfolioComment[]> {
  const database = await getDb();
  return database
    .collection<PortfolioComment>(COMMENTS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
