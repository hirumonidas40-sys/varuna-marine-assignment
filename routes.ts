import { Router } from "express";
import {
  getRoutesHandler,
  setBaselineHandler,
  getComparisonHandler,
} from "./routesControllers";
import {
  getCbHandler,
  bankHandler,
  applyBankHandler,
} from "./bankingControllers";
import { getAdjustedCbHandler, createPoolHandler } from "./poolControllers";

const router = Router();

router.get("/routes", getRoutesHandler);
router.post("/routes/:routeId/baseline", setBaselineHandler);
router.get("/routes/comparison", getComparisonHandler);

router.get("/compliance/cb", getCbHandler);
router.post("/banking/bank", bankHandler);
router.post("/banking/apply", applyBankHandler);

router.get("/compliance/adjusted-cb", getAdjustedCbHandler);
router.post("/pools", createPoolHandler);

export default router;
