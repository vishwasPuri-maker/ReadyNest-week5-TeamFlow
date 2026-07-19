import { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { isCloudinaryConfigured, uploadBuffer } from '../../config/cloudinary';

// Keep files in memory (max 5MB) so we can stream straight to Cloudinary.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file provided (field name: "file")');
  if (!isCloudinaryConfigured) {
    throw ApiError.badRequest('File upload is not configured. Set CLOUDINARY_* env vars.');
  }

  const url = await uploadBuffer(req.file.buffer, `teamflow/${req.auth!.organizationId}`);
  res.status(201).json({ success: true, data: { url } });
});
