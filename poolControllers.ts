import { Request, Response } from "express";
import { sampleData } from "./sampleData";

export async function getAdjustedCbHandler(req: Request, res: Response) {
  const year = Number(req.query.year ?? new Date().getFullYear());
  const adjusted = (sampleData.cbs as any[])
    .filter((c) => c.year === year)
    .map((c) => ({
      shipId: c.shipId,
      cbBefore: c.cbBefore,
      cbAfter: c.cbAfter,
    }));
  res.json(adjusted);
}

export async function createPoolHandler(req: Request, res: Response) {
  const { name, members, year } = req.body;
  // members: [{ shipId, share }]
  const adjusted = (sampleData.cbs as any[])
    .filter((c) => c.year === year)
    .map((c) => ({ shipId: c.shipId, cbBefore: c.cbBefore }));

  const sum = adjusted.reduce((s, it) => s + it.cbBefore, 0);
  if (sum < 0) return res.status(400).json({ error: "pool sum negative" });

  const membersWithCb = (members || []).map((m: any) => {
    const cb = adjusted.find((a) => a.shipId === m.shipId) || { cbBefore: 0 };
    return {
      shipId: m.shipId,
      cbBefore: cb.cbBefore,
      cbAfter: cb.cbBefore + (m.share || 0),
    };
  });
  res.json({ name, year, members: membersWithCb, poolSum: sum });
}
