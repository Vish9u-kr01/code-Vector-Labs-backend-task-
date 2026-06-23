import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and configure it.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    // Sensible pool size for a single-instance API server.
    maxPoolSize: 20,
  });

  isConnected = true;

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("MongoDB disconnected");
  });

  console.log(`MongoDB connected -> ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  isConnected = false;
}
