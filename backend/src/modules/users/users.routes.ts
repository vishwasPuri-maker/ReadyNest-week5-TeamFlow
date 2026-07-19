import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  addMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from './users.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listMembers);
// Member management is admin-only.
router.post('/', requireRole('ADMIN'), addMember);
router.patch('/:membershipId/role', requireRole('ADMIN'), updateMemberRole);
router.delete('/:membershipId', requireRole('ADMIN'), removeMember);

export default router;
