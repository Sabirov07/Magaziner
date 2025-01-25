import {Router} from 'express';
import { getProducts, createProduct, updateProductStock, getProductWithLogs } from '../controllers/productController'

const router = Router();

router.get('/:productId', getProductWithLogs);
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/', updateProductStock);

export default router
