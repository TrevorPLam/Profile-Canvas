import { Router } from 'express';
import multer from 'multer';
import { mediaService, type MediaUploadResult } from '../services/mediaService';
import { ProfileRepository } from '@workspace/db';
import { requireAuth } from '../middlewares/auth';

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Configure multer for post media (images and videos, 10MB limit)
const uploadPostMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for post media
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, MP4, and WebM are allowed.'));
    }
  },
});

const router = Router();

/**
 * POST /media/avatar
 * Upload an avatar image for the authenticated user
 */
router.post('/avatar', requireAuth, upload.single('file'), async (req, res): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Upload to storage
    const uploadResult: MediaUploadResult = await mediaService.uploadAvatar({
      userId: req.userId!,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    // Update profile with new avatar URL
    const profileRepo = new ProfileRepository();
    await profileRepo.update(req.userId!, { avatarUrl: uploadResult.url });

    // Return upload result
    res.status(201).json(uploadResult);
  } catch (error) {
    console.error('Avatar upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';

    if (message.includes('Invalid file type')) {
      res.status(400).json({ message });
      return;
    }
    if (message.includes('too large')) {
      res.status(413).json({ message });
      return;
    }

    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

/**
 * POST /media/upload
 * Upload media for a post (image or video)
 */
router.post(
  '/upload',
  requireAuth,
  uploadPostMedia.single('file'),
  async (req, res): Promise<void> => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      // Upload to storage
      const uploadResult: MediaUploadResult = await mediaService.uploadPostMedia({
        userId: req.userId!,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      });

      // Return upload result
      res.status(201).json(uploadResult);
    } catch (error) {
      console.error('Post media upload error:', error);
      const message = error instanceof Error ? error.message : 'Upload failed';

      if (message.includes('Invalid file type')) {
        res.status(400).json({ message });
        return;
      }
      if (message.includes('too large')) {
        res.status(413).json({ message });
        return;
      }

      res.status(500).json({ message: 'Failed to upload media' });
    }
  }
);

export default router;
