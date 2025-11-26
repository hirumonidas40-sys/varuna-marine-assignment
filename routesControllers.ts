import { Request, Response } from "express";
import { sampleData } from "./sampleData";

export async function getRoutesHandler(req: Request, res: Response) {
  const filters = req.query;
  let rows = sampleData.routes as any[];
  if (filters.vesselType)
    rows = rows.filter((r) => r.vesselType === filters.vesselType);
  if (filters.fuelType)
    rows = rows.filter((r) => r.fuelType === filters.fuelType);
  if (filters.year)
    rows = rows.filter((r) => String(r.year) === String(filters.year));
  res.json(rows);
}

export async function setBaselineHandler(req: Request, res: Response) {
  const { routeId } = req.params;
  const route = (sampleData.routes as any[]).find((r) => r.routeId === routeId);
  if (!route) return res.status(404).json({ error: "not found" });
  route.baselineSet = true;
  res.json({ routeId, baselineSet: true });
}

export async function getComparisonHandler(req: Request, res: Response) {
  const target = Number(req.query.target ?? 89.3368);
  const comparison = (sampleData.routes as any[]).map((r) => ({
    routeId: r.routeId,
    baselineGhg: r.ghgIntensity,
    // for example purposes, simulate a comparison value slightly better than baseline
    compGhg: Math.max(60, r.ghgIntensity - (Math.random() * 6 + 0.5)),
  }));
  res.json({ target, comparison });
}
