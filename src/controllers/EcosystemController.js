import express from "express";
import EcosystemUtils from "../utils/EcosystemUtils.js";

const router = express.Router();

// Fetch all libraries
router.get("/libraries", async (req, res) => {
  try {
    const libraries = await EcosystemUtils.fetchAllLibraries();
    res.status(200).json({ success: true, data: libraries });
  } catch (error) {
    console.error("Error fetching libraries:", error.message);
    res.status(500).json({ error: "Failed to fetch libraries" });
  }
});

// Fetch all printers
router.get("/printers", async (req, res) => {
  try {
    const printers = await EcosystemUtils.fetchAllPrinters();
    res.status(200).json({ success: true, data: printers });
  } catch (error) {
    console.error("Error fetching printers:", error.message);
    res.status(500).json({ error: "Failed to fetch printers" });
  }
});

export default router;
