import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import Product, { CATEGORIES } from "../models/Product.js";

const TOTAL = parseInt(process.env.SEED_COUNT, 10) || 200000;
const BATCH_SIZE = parseInt(process.env.SEED_BATCH_SIZE, 10) || 5000;

const ADJECTIVES = [
  "Sleek", "Compact", "Premium", "Eco", "Classic", "Modern", "Portable",
  "Durable", "Wireless", "Vintage", "Ultra", "Pro", "Essential", "Smart",
  "Rugged", "Lightweight", "Deluxe", "Everyday", "Pocket", "Heavy-Duty",
];

const NOUNS_BY_CATEGORY = {
  Electronics: ["Headphones", "Speaker", "Charger", "Webcam", "Monitor", "Router", "Drone", "Tablet", "Smartwatch", "Keyboard"],
  Fashion: ["Jacket", "Sneakers", "T-Shirt", "Jeans", "Scarf", "Backpack", "Sunglasses", "Hat", "Hoodie", "Belt"],
  Books: ["Novel", "Cookbook", "Biography", "Journal", "Atlas", "Guide", "Anthology", "Textbook", "Comic", "Planner"],
  Sports: ["Yoga Mat", "Dumbbell Set", "Tennis Racket", "Soccer Ball", "Running Shoes", "Water Bottle", "Helmet", "Jump Rope", "Resistance Band", "Bike Pump"],
  Home: ["Lamp", "Throw Pillow", "Cutting Board", "Candle", "Rug", "Mug Set", "Storage Bin", "Curtain", "Planter", "Blanket"],
  Toys: ["Building Blocks", "Puzzle", "Action Figure", "Board Game", "Plush Toy", "RC Car", "Doll House", "Toy Train", "Kite", "Yo-Yo"],
};

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice() {
  // $1.99 - $999.99, weighted toward cheaper items like a real catalog.
  const base = Math.random() ** 1.8 * 1000;
  return Math.max(1.99, Math.round(base * 100) / 100);
}

/**
 * Random timestamp spread over the last 2 years, with createdAt <= updatedAt
 * (updatedAt is sometimes a bit later, simulating a price/name edit).
 */
function randomTimestamps() {
  const now = Date.now();
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const createdAt = new Date(now - Math.random() * twoYearsMs);
  const maxEditDelayMs = 1000 * 60 * 60 * 24 * 30; // up to 30 days later
  const updatedAt = new Date(
    Math.min(now, createdAt.getTime() + Math.random() * maxEditDelayMs)
  );
  return { createdAt, updatedAt };
}

function buildProduct() {
  const category = randomItem(CATEGORIES);
  const noun = randomItem(NOUNS_BY_CATEGORY[category]);
  const adjective = randomItem(ADJECTIVES);
  const { createdAt, updatedAt } = randomTimestamps();

  return {
    name: `${adjective} ${noun}`,
    category,
    price: randomPrice(),
    createdAt,
    updatedAt,
  };
}

async function seed() {
  await connectDB();

  console.log(`Clearing existing products...`);
  await Product.deleteMany({});

  console.log(`Seeding ${TOTAL.toLocaleString()} products in batches of ${BATCH_SIZE.toLocaleString()}...`);

  const start = Date.now();
  let inserted = 0;

  for (let offset = 0; offset < TOTAL; offset += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL - offset);
    const batch = Array.from({ length: size }, buildProduct);

    // insertMany with ordered:false lets Mongo parallelize within the
    // batch and keeps going even if (unexpectedly) one doc fails
    // validation, instead of aborting the whole batch.
    await Product.insertMany(batch, { ordered: false });

    inserted += size;
    const pct = ((inserted / TOTAL) * 100).toFixed(1);
    process.stdout.write(
      `\r  ${inserted.toLocaleString()} / ${TOTAL.toLocaleString()} (${pct}%)`
    );
  }

  console.log(); // newline after progress bar

  console.log("Ensuring indexes exist...");
  await Product.syncIndexes();

  const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done. Inserted ${inserted.toLocaleString()} products in ${elapsedSec}s.`);

  await disconnectDB();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
