import { RequestHandler } from "express";
import { z } from "zod";
import { getCollection } from "../db";

const ReportSchema = z.object({
  date: z.string().min(1),
  location: z.string().min(1),
  symptoms: z.array(z.string()).default([]),
  affectedCount: z.number().int().min(0),
  notes: z.string().optional().default(""),
});

export type Report = z.infer<typeof ReportSchema> & { createdAt: string };

export const createReport: RequestHandler = async (req, res) => {
  try {
    const parsed = ReportSchema.parse(req.body);
    const doc: Report = { ...parsed, createdAt: new Date().toISOString() };
    const col = await getCollection<Report>("reports");
    const { insertedId } = await col.insertOne(doc as any);
    res.status(201).json({ id: insertedId.toString(), ...doc });
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
