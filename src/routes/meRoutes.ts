import { Router } from 'express';
import { getMyBooks } from '../controllers/bookController';
import { getProfile, updateProfile, getRequests } from '../controllers/meController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/books', authenticate, getMyBooks);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/requests', authenticate, getRequests);

export default router;
