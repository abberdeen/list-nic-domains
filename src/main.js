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
  const limit = parseInt(req.query.limit) || 3000;
  const offset = (page - 1) * limit;

  try {
    if (!databaseId || !collectionId) {
      throw new Error("Конфигурация базы данных или коллекции не найдена.");
    }

    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ]
    );

    // Удаление дубликатов с помощью Map
    // Ключ — домен, значение — объект с данными
    const uniqueMap = new Map();

    response.documents.forEach(doc => {
      if (doc.domain) {
        uniqueMap.set(doc.domain, {
          d: doc.domain,
          r: doc.date_registered
        });
      }
    });

    // Превращаем Map обратно в массив
    const filteredDocuments = Array.from(uniqueMap.values());

    return res.json({
      success: true,
      message: "",
      meta: {
        total: response.total,
        count_after_dedup: filteredDocuments.length, // кол-во без дубликатов в текущей пачке
        page: page,
        limit: limit
      },
      data: filteredDocuments
    });

  } catch (err) {
    error("Ошибка выполнения функции: " + err.message);

    return res.json({
      success: false,
      message: err.message,
      meta: {
        total: 0,
        page: page,
        limit: limit
      },
      data: []
    });
  }
};