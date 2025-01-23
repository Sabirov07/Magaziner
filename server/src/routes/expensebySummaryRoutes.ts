import { Router } from 'express';
import { getExpenseByCategory } from '../controllers/expesnseController';

const router = Router();

router.get('/', getExpenseByCategory)

export default router;