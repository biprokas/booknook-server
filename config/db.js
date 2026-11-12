
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("MONGODB_URI is missing from environment variables.");
}

if (!dbName) {
  throw new Error("DB_NAME is missing from environment variables.");
}

const client = new MongoClient(uri);

let db;

const connectDB = async () => {
  try {
    await client.connect();

    db = client.db(dbName);

    console.log("MongoDB connected successfully!");

    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected yet.");
  }

  return db;
};

module.exports = { connectDB, getDB, client };
