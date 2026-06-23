import express from "express";
import cors from "cors";
import productsRouter from "./routes/products.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/products", productsRouter);

  // 404 fallback
  app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  // Error fallback
  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
}
