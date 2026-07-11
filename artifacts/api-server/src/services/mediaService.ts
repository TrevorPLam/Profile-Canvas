import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// Allowed MIME types for avatar upload
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Allowed MIME types for post media upload (images and videos)
const ALLOWED_POST_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
]);

// Maximum file size for avatars (5MB)
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

// Maximum file size for post media (10MB)
const MAX_POST_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;

export interface MediaUploadResult {
  url: string;
  mediaId: string;
  mimeType: string;
  sizeBytes: number;
}

export interface AvatarUploadInput {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
}

export interface PostMediaUploadInput {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
}

/**
 * MediaService encapsulates media upload business logic.
 *
 * Deep module: Hides S3 configuration, upload validation, and URL generation
 * behind a simple interface of domain operations.
 */
export class MediaService {
  private s3Client!: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    // Initialize S3 client from environment variables
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_REGION || 'us-east-1';

    // Don't throw in constructor to allow test file loading
    // Validation will happen in upload methods
    if (this.bucketName) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });
    }
  }

  /**
   * Upload an avatar image for a user
   * @param input - The avatar upload input containing user ID, buffer, MIME type, and size
   * @returns The upload result with URL, media ID, MIME type, and size
   * @throws Error if validation fails or upload fails
   */
  async uploadAvatar(input: AvatarUploadInput): Promise<MediaUploadResult> {
    // Validate S3 configuration
    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    // Validate MIME type
    if (!ALLOWED_AVATAR_TYPES.has(input.mimeType)) {
      throw new Error(
        `Invalid file type: ${input.mimeType}. Allowed types: ${Array.from(
          ALLOWED_AVATAR_TYPES
        ).join(', ')}`
      );
    }

    // Validate file size
    if (input.sizeBytes > MAX_AVATAR_SIZE_BYTES) {
      throw new Error(
        `File too large: ${input.sizeBytes} bytes. Maximum size: ${MAX_AVATAR_SIZE_BYTES} bytes`
      );
    }

    // Generate unique media ID and filename
    const mediaId = randomUUID();
    const extension = this.getExtensionFromMimeType(input.mimeType);
    const filename = `avatars/${input.userId}/${mediaId}${extension}`;

    // Upload to S3
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: input.buffer,
          ContentType: input.mimeType,
          Metadata: {
            userId: input.userId,
            mediaId,
            uploadType: 'avatar',
          },
        })
      );
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error('Failed to upload file to storage');
    }

    // Generate public URL
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filename}`;

    return {
      url,
      mediaId,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    };
  }

  /**
   * Upload media for a post (image or video)
   * @param input - The post media upload input containing user ID, buffer, MIME type, and size
   * @returns The upload result with URL, media ID, MIME type, and size
   * @throws Error if validation fails or upload fails
   */
  async uploadPostMedia(input: PostMediaUploadInput): Promise<MediaUploadResult> {
    // Validate S3 configuration
    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    // Validate MIME type
    if (!ALLOWED_POST_MEDIA_TYPES.has(input.mimeType)) {
      throw new Error(
        `Invalid file type: ${input.mimeType}. Allowed types: ${Array.from(
          ALLOWED_POST_MEDIA_TYPES
        ).join(', ')}`
      );
    }

    // Validate file size
    if (input.sizeBytes > MAX_POST_MEDIA_SIZE_BYTES) {
      throw new Error(
        `File too large: ${input.sizeBytes} bytes. Maximum size: ${MAX_POST_MEDIA_SIZE_BYTES} bytes`
      );
    }

    // Generate unique media ID and filename
    const mediaId = randomUUID();
    const extension = this.getExtensionFromMimeType(input.mimeType);
    const filename = `posts/${input.userId}/${mediaId}${extension}`;

    // Upload to S3
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: input.buffer,
          ContentType: input.mimeType,
          Metadata: {
            userId: input.userId,
            mediaId,
            uploadType: 'post',
          },
        })
      );
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error('Failed to upload file to storage');
    }

    // Generate public URL
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filename}`;

    return {
      url,
      mediaId,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    };
  }

  /**
   * Get file extension from MIME type
   * @param mimeType - The MIME type
   * @returns The file extension with leading dot
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
    };

    return extensions[mimeType] || '.jpg';
  }
}

// Export a singleton instance for convenience
export const mediaService = new MediaService();
