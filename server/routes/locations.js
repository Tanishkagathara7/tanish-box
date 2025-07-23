import express from "express";
import Location from "../models/Location.js";

const adminRouter = express.Router();

// GET /api/admin/locations - get all locations
adminRouter.get("/", async (req, res) => {
  try {
    const locations = await Location.find({});
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ success: false, message: "Failed to fetch locations" });
  }
});

export { adminRouter }; 