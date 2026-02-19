import { v2 as cloudinary } from 'cloudinary';

class CloudinaryService {
  private isInitialized: boolean = false;

  /**
   * Initialize Cloudinary with credentials from environment variables
   */
  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Cloudinary already initialized');
      return;
    }

    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        console.warn(
          '⚠️ Cloudinary configuration incomplete. Missing environment variables:\n' +
          `  CLOUDINARY_CLOUD_NAME: ${cloudName ? '✓' : '✗'}\n` +
          `  CLOUDINARY_API_KEY: ${apiKey ? '✓' : '✗'}\n` +
          `  CLOUDINARY_API_SECRET: ${apiSecret ? '✗' : '✓'}\n` +
          'Image upload features will not work until configured.'
        );
        return;
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      this.isInitialized = true;
      console.log('✅ Cloudinary initialized successfully');
    } catch (error) {
      console.error('❌ Cloudinary initialization failed:', error);
    }
  }

  /**
   * Upload an image to Cloudinary
   * @param base64Data Base64 encoded image data (with or without data URI prefix)
   * @param folder Cloudinary folder to upload to (e.g., 'profile-pictures')
   * @param publicId Optional custom public ID for the image
   * @returns Promise resolving to Cloudinary upload result with secure URL
   */
  async uploadImage(
    base64Data: string,
    folder: string = 'uploads',
    publicId?: string
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    if (!this.isInitialized) {
      throw new Error('Cloudinary is not initialized. Please check your configuration.');
    }

    try {
      console.log('📦 [CLOUDINARY] Starting upload...', { folder, publicId });

      // Ensure base64 data has the correct prefix
      const base64WithPrefix = base64Data.startsWith('data:')
        ? base64Data
        : `data:image/jpeg;base64,${base64Data}`;

      const uploadOptions: any = {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' }, // Limit max dimensions
          { quality: 'auto:good' }, // Auto quality optimization
          { fetch_format: 'auto' }, // Auto format (WebP when supported)
        ],
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(base64WithPrefix, uploadOptions);

      console.log('✅ [CLOUDINARY] Upload successful:', {
        publicId: result.public_id,
        url: result.secure_url,
        size: result.bytes,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (error: any) {
      console.error('❌ [CLOUDINARY] Upload failed:', error.message);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Delete an image from Cloudinary
   * @param publicId The public ID of the image to delete
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('⚠️ Cloudinary not initialized');
      return false;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`✅ [CLOUDINARY] Deleted image: ${publicId}`, result);
      return result.result === 'ok';
    } catch (error: any) {
      console.error(`❌ [CLOUDINARY] Failed to delete image ${publicId}:`, error.message);
      return false;
    }
  }

  /**
   * Check if Cloudinary is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
