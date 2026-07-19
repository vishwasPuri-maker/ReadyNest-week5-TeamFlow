import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  restockProduct,
  updateProduct,
} from './products.controller';

const router = Router();

router.use(requireAuth);

// Staff and owners can browse the catalogue.
router.get('/', listProducts);
router.get('/:id', getProduct);

// Product management is owner (ADMIN) only.
router.post('/', requireRole('ADMIN'), createProduct);
router.patch('/:id', requireRole('ADMIN'), updateProduct);
router.post('/:id/restock', requireRole('ADMIN'), restockProduct);
router.delete('/:id', requireRole('ADMIN'), deleteProduct);

export default router;
