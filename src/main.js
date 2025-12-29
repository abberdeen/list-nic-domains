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
    // Проверка наличия переменных окружения
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

    const filteredDocuments = response.documents.map(doc => ({
      domain: doc.domain,
      date_registered: doc.date_registered, 
    }));

    // Успешный ответ
    return res.json({
      success: true,
      message: "", // Пустое сообщение при успехе
      meta: {
        total: response.total,
        page: page,
        limit: limit
      },
      data: filteredDocuments
    });

  } catch (err) {
    // Логируем ошибку для отладки в консоли Appwrite
    error("Ошибка выполнения функции: " + err.message);

    // Ответ в случае ошибки
    return res.json({
      success: false,
      message: err.message, // Текст ошибки попадает сюда
      meta: {
        total: 0,
        page: page,
        limit: limit
      },
      data: [] // Пустой массив данных
    });
  }
};