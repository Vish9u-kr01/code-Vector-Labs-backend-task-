import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`API server listening on https://product-browser-frontend-iota.vercel.app/:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
