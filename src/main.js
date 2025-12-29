import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2000;
  const offset = (page - 1) * limit;

  try {
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ]
    );

    // Фильтруем документы: оставляем только нужные ключи
    const filteredDocuments = response.documents.map(doc => ({
      domain: doc.domain,
      date_registered: doc.date_registered,
      createdAt: doc.$createdAt // переименовываем или оставляем системную дату
    }));

    return res.json({
      success: true,
      meta: {
        total: response.total,
        page: page,
        limit: limit
      },
      data: filteredDocuments // отправляем чистые данные
    });

  } catch (err) {
    error("Ошибка: " + err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};