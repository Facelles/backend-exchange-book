import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getExchangeRequests,
} from "../controllers/profileController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getProfile);
router.put("/", updateProfile);
router.get("/exchange-requests", getExchangeRequests);

export default router;
