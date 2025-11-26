import { Request, Response } from "express";
import { sampleData } from "./sampleData";

export async function getCbHandler(req: Request, res: Response) {
  const year = Number(req.query.year ?? new Date().getFullYear());
  const cbs = (sampleData.cbs as any[]).filter((c) => c.year === year);
  res.json(cbs);
}

export async function bankHandler(req: Request, res: Response) {
  const { shipId, year, amount } = req.body;
  const cb = (sampleData.cbs as any[]).find(
    (c) => c.shipId === shipId && c.year === year
  );
  if (!cb) return res.status(404).json({ error: "cb not found" });
  if (amount <= 0)
    return res.status(400).json({ error: "amount must be positive" });
  cb.cbBefore += amount;
  cb.applied += amount;
  cb.cbAfter = cb.cbBefore;
  res.json(cb);
}

export async function applyBankHandler(req: Request, res: Response) {
  const { fromShipId, toShipId, year, amount } = req.body;
  const from = (sampleData.cbs as any[]).find(
    (c) => c.shipId === fromShipId && c.year === year
  );
  const to = (sampleData.cbs as any[]).find(
    (c) => c.shipId === toShipId && c.year === year
  );
  if (!from || !to) return res.status(404).json({ error: "cb not found" });
  if (from.cbBefore < amount)
    return res.status(400).json({ error: "insufficient cb" });
  from.cbBefore -= amount;
  from.cbAfter = from.cbBefore;
  to.cbBefore += amount;
  to.cbAfter = to.cbBefore;
  res.json({ from, to, applied: amount });
}
