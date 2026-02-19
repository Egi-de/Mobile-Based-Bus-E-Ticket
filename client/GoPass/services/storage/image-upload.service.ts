import * as ImageManipulator from 'expo-image-manipulator';
import { cloudinaryStorageService } from './cloudinary-storage.service';

export class ImageUploadService {
  /**
   * Compresses and uploads an image to Cloudinary
   * @param uri Local image URI
   * @param userId User ID for path generation
   * @param type Image type (profile, route, etc.)
   * @param onProgress Progress callback (not used with Cloudinary)
   * @returns Download URL
   */
  async uploadImage(
    uri: string,
    userId: string,
    type: 'profile' | 'route' | 'bus' = 'profile',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // 1. Compress image to reduce size
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Resize to max width 800px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. Determine folder and filename
      let folder = '';
      let filename = '';
      
      switch (type) {
        case 'profile':
          folder = 'profile-pictures';
          filename = cloudinaryStorageService.getProfilePicturePath(userId);
          break;
        case 'route':
          folder = 'route-images';
          filename = `route-${Date.now()}`;
          break;
        case 'bus':
          folder = 'bus-images';
          filename = `bus-${Date.now()}`;
          break;
      }

      // 3. Upload to Cloudinary via backend
      const downloadURL = await cloudinaryStorageService.uploadImage(
        manipulatedImage.uri,
        folder,
        filename
      );

      return downloadURL;
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  }
}

export const imageUploadService = new ImageUploadService();
