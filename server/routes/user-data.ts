import { RequestHandler } from "express";
import { z } from "zod";
import { getCollection } from "../db";
import { getLocationCoordinates } from "../../shared/utils/risk-calculation";

const UserDataSchema = z.object({
  location: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  category: z.string().optional().default("General"),
  riskPercentage: z.number().min(0).max(100),
  notes: z.string().optional().default(""),
});

export type UserData = z.infer<typeof UserDataSchema> & {
  createdAt: string;
  coordinates?: { latitude: number; longitude: number } | null;
};

export const createUserData: RequestHandler = async (req, res) => {
  try {
    const parsed = UserDataSchema.parse(req.body);

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

    const doc: UserData = {
      ...parsed,
      createdAt: new Date().toISOString(),
      coordinates,
    };

    // Save the user data
    const userDataCol = await getCollection<UserData>("userData");
    const { insertedId } = await userDataCol.insertOne(doc as any);

    console.log(
      `User marker saved for ${parsed.location}: ${parsed.riskPercentage}% risk`,
    );

    res.json({
      success: true,
      message: "User marker submitted successfully!",
      id: insertedId.toString(),
      coordinates,
    });
  } catch (error: any) {
    console.error("Error creating user data:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Invalid user data",
        details: error.errors,
      });
    }
    res.status(500).json({ error: "Failed to submit user marker" });
  }
};

export const getUserData: RequestHandler = async (_req, res) => {
  try {
    const collection = await getCollection<UserData>("userData");
    const userData = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: userData });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to retrieve user data" });
  }
};

export const deleteUserData: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "User data ID is required" });
    }

    const collection = await getCollection<UserData>("userData");

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
        message: "User marker deleted successfully",
      });
    } else {
      res.status(404).json({ error: "User marker not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to delete user marker" });
  }
};
