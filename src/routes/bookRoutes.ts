import { Router } from "express";
import {
  getBooks,
  getBookById,
  createBook,
  deleteBook,
  requestExchange,
} from "../controllers/bookController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", getBooks);
router.get("/:id", getBookById);

router.post("/", authenticate, createBook);
router.delete("/:id", authenticate, deleteBook);
router.post("/:id/exchange", authenticate, requestExchange);

export default router;
