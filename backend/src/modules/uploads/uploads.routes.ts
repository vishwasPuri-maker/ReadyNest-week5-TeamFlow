import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { upload, uploadFile } from './uploads.controller';

const router = Router();

router.post('/', requireAuth, upload.single('file'), uploadFile);

export default router;
