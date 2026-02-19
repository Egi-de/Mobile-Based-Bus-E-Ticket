import { apiClient } from '../api/client';

export class CloudinaryStorageService {
  /**
   * Uploads an image to Cloudinary via backend
   * @param uri Local file URI (from Expo ImagePicker)
   * @param folder Cloudinary folder (e.g., 'profile-pictures')
   * @param filename Optional custom filename
   * @returns Promise resolving to Cloudinary URL
   */
  async uploadImage(uri: string, folder: string = 'uploads', filename?: string): Promise<string> {
    try {
      console.log('📦 [UPLOAD] Starting Cloudinary upload...', { uri, folder, filename });

      // 1. Convert image to base64
      const response = await fetch(uri);
      const blob = await response.blob();

      console.log('📦 [UPLOAD] Blob created:', {
        size: blob.size,
        type: blob.type
      });

      // Convert blob to base64
      const base64 = await this.blobToBase64(blob);

      console.log('🔗 [UPLOAD] Sending to backend...');

      // 2. Send to backend
      const uploadResponse = await apiClient.post('/storage/upload', {
        base64Data: base64,
        folder,
        filename
      });

      const { url } = uploadResponse.data as { url: string };

      console.log('✅ [UPLOAD] Upload successful:', { url });

      return url;
    } catch (error: any) {
      console.error('❌ Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Generates a unique filename for profile pictures
   * @param userId User ID
   * @param extension File extension (default: jpg)
   */
  getProfilePicturePath(userId: string, extension: string = 'jpg'): string {
    const timestamp = Date.now();
    return `${userId}-${timestamp}`;
  }
}

export const cloudinaryStorageService = new CloudinaryStorageService();
