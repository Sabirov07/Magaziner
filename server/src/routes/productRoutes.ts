import {Router} from 'express';
import { getProducts, createProduct, updateProductStock, getProductWithLogs } from '../controllers/productController'

const router = Router();

router.get('/', getProducts);
router.get('/:productId', getProductWithLogs);
router.post('/', createProduct);
router.put('/', updateProductStock);

export default router
