import { RequestHandler } from "express";
import { z } from "zod";
import { getCollection } from "../db";
import {
  calculateRiskLevel,
  getLocationCoordinates,
  validateLocationNeedsCoordinates,
} from "../../shared/utils/risk-calculation";

const ReportSchema = z.object({
  date: z.string().min(1),
  location: z.string().min(1),
  symptoms: z.array(z.string()).default([]),
  affectedCount: z.number().int().min(0),
  notes: z.string().optional().default(""),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type Report = z.infer<typeof ReportSchema> & {
  createdAt: string;
  riskPercentage?: number;
  coordinates?: { latitude: number; longitude: number } | null;
};

export const createReport: RequestHandler = async (req, res) => {
  try {
    const parsed = ReportSchema.parse(req.body);

    // Calculate risk level based on affected count and symptoms
    const riskPercentage = calculateRiskLevel(
      parsed.affectedCount,
      parsed.symptoms,
    );

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

    const doc: Report = {
      ...parsed,
      createdAt: new Date().toISOString(),
      riskPercentage,
      coordinates,
    };

    // Save the report
    const reportsCol = await getCollection<Report>("reports");
    const { insertedId } = await reportsCol.insertOne(doc as any);

    console.log(`Report saved for ${parsed.location}: ${riskPercentage}% risk`);

    res.status(201).json({
      id: insertedId.toString(),
      ...doc,
      message: coordinates
        ? `Report submitted successfully. Risk level: ${riskPercentage}% will appear in analytics with coordinates.`
        : `Report submitted successfully. Risk level: ${riskPercentage}% will appear in analytics (coordinates not found).`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Invalid request" });
  }
};

export const listReports: RequestHandler = async (_req, res) => {
  try {
    const col = await getCollection<Report>("reports");
    const items = await col
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

export const validateLocation: RequestHandler = async (req, res) => {
  try {
    const { location } = req.query;

    if (!location || typeof location !== "string") {
      return res.status(400).json({ error: "Location parameter is required" });
    }

    const validation = await validateLocationNeedsCoordinates(location);
    res.json(validation);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Internal error" });
  }
};
