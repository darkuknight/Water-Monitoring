import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createReport, listReports } from "./routes/reports";
import { handleSensors } from "./routes/sensors";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Reports API
  app.post("/api/reports", createReport);
  app.get("/api/reports", listReports);

  // Sensors API (simulated with optional TB integration)
  app.get("/api/sensors", handleSensors);

  return app;
}
