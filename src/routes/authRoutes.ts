import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

const router = Router();

// POST /api/register
router.post("/register", register);

// POST /api/login
router.post("/login", login);

// POST /api/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/reset-password
router.post("/reset-password", resetPassword);

export default router;
