import { Request, Response } from 'express';
import { cloudinaryService } from '../services/cloudinary.service';
import { sendSuccess, sendError } from '../utils/response';

export class StorageController {
  /**
   * Upload an image to Cloudinary
   * POST /api/storage/upload
   * Body: { base64Data: string, folder?: string, filename?: string }
   */
  static async uploadImage(req: Request, res: Response): Promise<Response> {
    try {
      const { base64Data, folder, filename } = req.body;

      if (!base64Data) {
        return sendError(res, 'Base64 image data is required', 400);
      }

      if (!cloudinaryService.isReady()) {
        return sendError(res, 'Cloudinary service not available', 503);
      }

      console.log('📦 [STORAGE] Uploading to Cloudinary...', {
        folder: folder || 'uploads',
        hasFilename: !!filename,
      });

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadImage(
        base64Data,
        folder || 'uploads',
        filename
      );

      console.log('✅ [STORAGE] Upload successful:', {
        url: result.url,
        publicId: result.publicId,
      });

      return sendSuccess(
        res,
        {
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
        },
        'Image uploaded successfully'
      );
    } catch (error: any) {
      console.error('❌ [STORAGE] Upload error:', error);
      return sendError(res, error.message || 'Failed to upload image', 500);
    }
  }

  /**
   * Delete an image from Cloudinary
   * DELETE /api/storage/:publicId
   */
  static async deleteImage(req: Request, res: Response): Promise<Response> {
    try {
      const publicId = Array.isArray(req.params.publicId) 
        ? req.params.publicId[0] 
        : req.params.publicId;

      const success = await cloudinaryService.deleteImage(publicId);

      if (success) {
        return sendSuccess(res, { publicId }, 'Image deleted successfully');
      } else {
        return sendError(res, 'Failed to delete image', 500);
      }
    } catch (error: any) {
      console.error('❌ [STORAGE] Delete error:', error);
      return sendError(res, error.message || 'Failed to delete image', 500);
    }
  }
}
