import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from './projects.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.patch('/:id', updateProject);
// Only admins can delete a project.
router.delete('/:id', requireRole('ADMIN'), deleteProject);

export default router;
