import { Router } from 'express';
import {
  getBooks,
  getMyBooks,
  createBook,
  deleteBook,
  requestExchange,
} from '../controllers/bookController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/books — public, supports ?search=&limit=&offset=
router.get('/', getBooks);

// GET /api/me/books — current user's books
router.get('/me/books', authenticate, getMyBooks);

// POST /api/books — create a book (authenticated)
router.post('/', authenticate, createBook);

// DELETE /api/books/:id — owner or admin
router.delete('/:id', authenticate, deleteBook);

// POST /api/books/:id/exchange — send exchange email
router.post('/:id/exchange', authenticate, requestExchange);

export default router;
