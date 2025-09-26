import { RequestHandler } from "express";
import { z } from "zod";
import { getCollection } from "../db";
import {
  getLocationCoordinates,
  validateLocationNeedsCoordinates,
} from "../../shared/utils/risk-calculation";

const WaterTestSchema = z.object({
  location: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  kit: z.string().min(1),
  overallRisk: z.string(),
  confidence: z.number().min(0).max(1),
  criticalParameters: z.number().int().min(0),
  totalParameters: z.number().int().min(0),
  testDate: z.string(),
  riskPercentage: z.number().min(0).max(100), // Accept calculated risk from frontend
  notes: z.string().optional().default(""),
});

export type WaterTest = z.infer<typeof WaterTestSchema> & {
  createdAt: string;
  coordinates?: { latitude: number; longitude: number } | null;
};

export const createWaterTest: RequestHandler = async (req, res) => {
  try {
    const parsed = WaterTestSchema.parse(req.body);

    // Use provided coordinates or get coordinates for the location
    let coordinates: { latitude: number; longitude: number } | null = null;

    if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
      // User provided coordinates
      coordinates = {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    } else {
      // Get coordinates through geocoding
      coordinates = await getLocationCoordinates(parsed.location);
    }

    const doc: WaterTest = {
      ...parsed,
      createdAt: new Date().toISOString(),
      coordinates,
    };

    // Save the water test
    const waterTestsCol = await getCollection<WaterTest>("waterTests");
    const { insertedId } = await waterTestsCol.insertOne(doc as any);

    console.log(
      `Water test saved for ${parsed.location}: ${parsed.riskPercentage}% risk`,
    );

    res.json({
      success: true,
      message: "Water test submitted successfully!",
      id: insertedId.toString(),
      riskPercentage: parsed.riskPercentage,
      coordinates,
    });
  } catch (error: any) {
    console.error("Error creating water test:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Invalid water test data",
        details: error.errors,
      });
    }
    res.status(500).json({ error: "Failed to submit water test" });
  }
};

export const getWaterTests: RequestHandler = async (_req, res) => {
  try {
    const collection = await getCollection<WaterTest>("waterTests");
    const waterTests = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: waterTests });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to retrieve water tests" });
  }
};

export const deleteWaterTest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Water test ID is required" });
    }

    const collection = await getCollection<WaterTest>("waterTests");

    // Try to find by string id first, then ObjectId
    const { ObjectId } = await import("mongodb");
    let result;

    try {
      const objectId = new ObjectId(id);
      result = await collection.deleteOne({ _id: objectId });
    } catch (error) {
      // If ObjectId conversion fails, try string id
      result = await collection.deleteOne({ id: id });
    }

    if (result.deletedCount > 0) {
      res.json({
        success: true,
        message: "Water test deleted successfully",
      });
    } else {
      res.status(404).json({ error: "Water test not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to delete water test" });
  }
};

// Validate location for water test
export const validateWaterTestLocation: RequestHandler = async (req, res) => {
  try {
    const { location } = req.query;

    if (!location || typeof location !== "string") {
      return res.status(400).json({ error: "Location is required" });
    }

    const validation = await validateLocationNeedsCoordinates(location);
    res.json(validation);
  } catch (error) {
    console.error("Location validation error:", error);
    res.status(500).json({ error: "Failed to validate location" });
  }
};
