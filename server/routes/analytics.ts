import { RequestHandler } from "express";
import { getCollection } from "../db";
import { ObjectId } from "mongodb";

// Enhanced interface for location risk data with marker types
interface EnhancedLocationRisk {
  _id?: ObjectId;
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  riskPercentage: number;
  timestamp: number;
  type: "report" | "water-test" | "user-added";
  source?: string; // For tracking where the data came from
  metadata?: {
    // For reports
    symptoms?: string[];
    affectedCount?: number;
    notes?: string;
    // For water tests
    kit?: string;
    overallRisk?: string;
    confidence?: number;
    criticalParameters?: number;
    totalParameters?: number;
    testDate?: string;
    // For user-added
    title?: string;
    description?: string;
    category?: string;
  };
}

export const addLocationRisk: RequestHandler = async (req, res) => {
  try {
    const {
      location,
      riskPercentage,
      latitude,
      longitude,
      type = "user-added",
      source,
      metadata,
    } = req.body;

    // Validate required fields
    if (!location || riskPercentage === undefined) {
      return res.status(400).json({
        error: "Location and riskPercentage are required",
      });
    }

    // Validate risk percentage range
    if (riskPercentage < 0 || riskPercentage > 100) {
      return res.status(400).json({
        error: "Risk percentage must be between 0 and 100",
      });
    }

    // Validate marker type
    if (!["report", "water-test", "user-added"].includes(type)) {
      return res.status(400).json({
        error: "Invalid marker type",
      });
    }

    const collection =
      await getCollection<EnhancedLocationRisk>("locationRisks");

    const newLocationRisk: EnhancedLocationRisk = {
      id: Date.now().toString(),
      location,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      riskPercentage: parseFloat(riskPercentage),
      timestamp: Date.now(),
      type,
      source,
      metadata,
    };

    // For user-added markers, always create new entries
    // For reports and water tests, update existing if same location
    if (type === "user-added") {
      const insertResult = await collection.insertOne(newLocationRisk);
      res.json({
        success: true,
        message: "User marker added successfully",
        data: { ...newLocationRisk, _id: insertResult.insertedId },
      });
    } else {
      // Check if location already exists for reports/water tests
      const existingLocation = await collection.findOne({
        location: { $regex: new RegExp(`^${location}$`, "i") },
        type: type,
      });

      if (existingLocation) {
        // Update existing location
        const updateResult = await collection.updateOne(
          { _id: existingLocation._id },
          {
            $set: {
              ...newLocationRisk,
              _id: existingLocation._id,
            },
          },
        );

        if (updateResult.matchedCount > 0) {
          res.json({
            success: true,
            message: "Location risk updated successfully",
            data: { ...newLocationRisk, _id: existingLocation._id },
          });
        } else {
          res.status(500).json({ error: "Failed to update location risk" });
        }
      } else {
        // Add new location
        const insertResult = await collection.insertOne(newLocationRisk);
        res.json({
          success: true,
          message: "Location risk added successfully",
          data: { ...newLocationRisk, _id: insertResult.insertedId },
        });
      }
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to add location risk data" });
  }
};

export const getLocationRisks: RequestHandler = async (_req, res) => {
  try {
    // Get data from all three collections
    const reportsCol = await getCollection("reports");
    const waterTestsCol = await getCollection("waterTests");
    const userDataCol = await getCollection("userData");

    // Fetch all data
    const [reports, waterTests, userData] = await Promise.all([
      reportsCol.find({}).sort({ createdAt: -1 }).toArray(),
      waterTestsCol.find({}).sort({ createdAt: -1 }).toArray(),
      userDataCol.find({}).sort({ createdAt: -1 }).toArray(),
    ]);

    // Transform reports to analytics format
    const reportRisks: EnhancedLocationRisk[] = reports.map((report: any) => ({
      id: report._id.toString(),
      location: report.location,
      latitude: report.coordinates?.latitude,
      longitude: report.coordinates?.longitude,
      riskPercentage: report.riskPercentage || 0,
      timestamp: new Date(report.createdAt).getTime(),
      type: "report" as const,
      source: "community_report",
      metadata: {
        symptoms: report.symptoms || [],
        affectedCount: report.affectedCount || 0,
        notes: report.notes || "",
      },
    }));

    // Transform water tests to analytics format
    const waterTestRisks: EnhancedLocationRisk[] = waterTests.map(
      (test: any) => ({
        id: test._id.toString(),
        location: test.location,
        latitude: test.coordinates?.latitude,
        longitude: test.coordinates?.longitude,
        riskPercentage: test.riskPercentage || 0,
        timestamp: new Date(test.createdAt).getTime(),
        type: "water-test" as const,
        source: "water_test",
        metadata: {
          kit: test.kit || "Unknown",
          overallRisk: test.overallRisk || "Unknown",
          confidence: test.confidence || 0,
          criticalParameters: test.criticalParameters || 0,
          totalParameters: test.totalParameters || 0,
          testDate: test.testDate,
        },
      }),
    );

    // Transform user data to analytics format
    const userDataRisks: EnhancedLocationRisk[] = userData.map((data: any) => ({
      id: data._id.toString(),
      location: data.location,
      latitude: data.coordinates?.latitude,
      longitude: data.coordinates?.longitude,
      riskPercentage: data.riskPercentage || 0,
      timestamp: new Date(data.createdAt).getTime(),
      type: "user-added" as const,
      source: "user_added",
      metadata: {
        title: data.title || "User Marker",
        description: data.description || "",
        category: data.category || "General",
      },
    }));

    // Combine all risks and sort by timestamp
    const allRisks = [...reportRisks, ...waterTestRisks, ...userDataRisks].sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    res.json({ success: true, data: allRisks });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to retrieve location risk data" });
  }
};

export const deleteLocationRisk: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Marker ID is required" });
    }

    // Try to delete from all three collections
    const reportsCol = await getCollection("reports");
    const waterTestsCol = await getCollection("waterTests");
    const userDataCol = await getCollection("userData");

    let result = { deletedCount: 0 };
    let deletedFrom = "";

    try {
      const objectId = new ObjectId(id);

      // Try reports first
      result = await reportsCol.deleteOne({ _id: objectId });
      if (result.deletedCount > 0) {
        deletedFrom = "reports";
      } else {
        // Try water tests
        result = await waterTestsCol.deleteOne({ _id: objectId });
        if (result.deletedCount > 0) {
          deletedFrom = "water tests";
        } else {
          // Try user data
          result = await userDataCol.deleteOne({ _id: objectId });
          if (result.deletedCount > 0) {
            deletedFrom = "user data";
          }
        }
      }
    } catch (error) {
      // Invalid ObjectId format
    }

    if (result.deletedCount > 0) {
      res.json({
        success: true,
        message: `Marker deleted successfully from ${deletedFrom}`,
      });
    } else {
      res.status(404).json({ error: "Marker not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to delete marker" });
  }
};
