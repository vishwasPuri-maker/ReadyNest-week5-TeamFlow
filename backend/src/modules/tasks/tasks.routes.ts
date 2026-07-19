import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from './tasks.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
