import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import Product, { CATEGORIES } from "../models/Product.js";

const COUNT = parseInt(process.argv[2], 10) || 50;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function insertMore() {
  await connectDB();

  const now = Date.now();
  const docs = Array.from({ length: COUNT }, (_, i) => {
    const category = randomItem(CATEGORIES);
    const ts = new Date(now + i);
    return {
      name: `${category} Item ${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      category,
      price: Math.round((Math.random() * 495 + 5) * 100) / 100,
      createdAt: ts,
      updatedAt: ts,
    };
  });

  const result = await Product.insertMany(docs, { ordered: false });
  console.log(`Inserted ${result.length} new products with fresh timestamps.`);

  await disconnectDB();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

insertMore().catch((err) => {
  console.error("Insert failed:", err);
  process.exit(1);
});
