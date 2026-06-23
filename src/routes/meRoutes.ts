import { Router } from 'express';
import { getMyBooks } from '../controllers/bookController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/books', authenticate, getMyBooks);

export default router;
