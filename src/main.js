import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // 1. Initialize with your specific environment variables
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID;

  // 2. Extract pagination details from the request
  // Example URL: .../function-id?page=11&limit=200
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100; // Default to 100 items per request
  
  // Calculate the starting point (offset)
  const offset = (page - 1) * limit;

  // Validation
  if (!databaseId || !collectionId) {
    error("Environment variables for Database or Collection ID are missing.");
    return res.json({ error: "Server configuration error" }, 500);
  }

  try {
    // 3. Fetch the specific slice of data
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt') // Recommended: keeps order consistent during paging
      ]
    );

    // 4. Return results with metadata
    return res.json({
      success: true,
      meta: {
        total: response.total,
        page: page,
        limit: limit,
        remaining: Math.max(0, response.total - (offset + response.documents.length))
      },
      data: response.documents
    });

  } catch (err) {
    error("Appwrite Error: " + err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};