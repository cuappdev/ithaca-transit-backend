import express from "express";
import sqlite3 from "sqlite3";

const router = express.Router();

router.get("/health", (_req, res) => {
  const dbPath = new URL("../data/transit.db", import.meta.url).pathname;
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      return res.status(503).json({ status: "unhealthy", database: "disconnected" });
    }
  });
  db.get("SELECT 1", (err) => {
    db.close();
    if (err) {
      return res.status(503).json({ status: "unhealthy", database: "disconnected" });
    }
    res.status(200).json({ status: "healthy", database: "connected" });
  });
});

export default router;
