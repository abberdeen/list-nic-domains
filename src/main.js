import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = process.env.APPWRITE_COLLECTION_ID;

    const limit = Math.min(Number(req.query?.limit ?? 100), 100);
    const cursor = req.query?.cursor ?? null;

    const queries = [Query.limit(limit), Query.orderDesc('$createdAt')];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    let all = [];
    let lastId = cursor;
    let fetched = 0;

    // paginate until no more docs (or until a safe cap)
    const HARD_CAP = 10000;

    while (fetched < HARD_CAP) {
      const list = await databases.listDocuments(databaseId, collectionId, queries);

      const docs = list?.documents ?? [];
      all.push(...docs);
      fetched += docs.length;

      if (docs.length < limit) break;

      lastId = docs[docs.length - 1].$id;

      // update cursorAfter for next page
      queries.splice(
        0,
        queries.length,
        Query.limit(limit),
        Query.orderDesc('$createdAt'),
        Query.cursorAfter(lastId)
      );
    }

    return res.json({
      success: true,
      total: all.length,
      cursor_next: all.length ? all[all.length - 1].$id : null,
      rows: all,
    });
  } catch (err) {
    error(err?.message ?? String(err));
    return res.json({ success: false, message: err?.message ?? 'Failed to list rows' }, 500);
  }
};
