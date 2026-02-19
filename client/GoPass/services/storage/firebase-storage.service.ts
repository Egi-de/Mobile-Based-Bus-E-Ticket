import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseStorage } from '../firebase/firebase.config';

export class FirebaseStorageService {
  /**
   * Uploads an image to Firebase Storage
   * @param uri Local file URI (from Expo ImagePicker)
   * @param path Storage path (e.g., 'profile-pictures/userId.jpg')
   * @param onProgress Optional callback for upload progress (0-100)
   * @returns Promise resolving to download URL
   */
  async uploadImage(uri: string, path: string, onProgress?: (progress: number) => void): Promise<string> {
    if (!firebaseStorage) {
      throw new Error('Firebase Storage is not initialized');
    }

    try {
      console.log('📦 [UPLOAD] Starting upload via Signed URL...', { uri, path });
      
      // 1. Fetch the file/blob from the URI
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log('📦 [UPLOAD] Blob created:', { 
        size: blob.size, 
        type: blob.type 
      });

      // 2. Get Signed URL from Backend
      // We need to use the apiClient to get the signed URL
      // Since we can't easily import apiClient here due to circular dependencies/context,
      // we'll use a direct fetch to the API URL if possible, or we need to refactor.
      // Better approach: Let the caller handle the API client part? 
      // Or, since this is a service, we can import apiClient.
      
      const { apiClient } = require('../api/client');
      console.log('🔗 [UPLOAD] Requesting Signed URL...');
      
      const signResponse = await apiClient.get('/storage/upload-url', {
        filename: path,
        contentType: blob.type
      });
      
      const { url: signedUrl, bucket } = signResponse.data;
      console.log('✅ [UPLOAD] Got Signed URL', { bucket, urlPreview: signedUrl.substring(0, 100) + '...' });

      // 3. Upload to Signed URL
      // explicit PUT request with the blob
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': blob.type
        }
      });

      if (!uploadResponse.ok) {
        const responseText = await uploadResponse.text().catch(() => 'Unable to read response');
        console.error('❌ [UPLOAD] Upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          responsePreview: responseText.substring(0, 200),
          bucket,
          path
        });
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      console.log('✅ [UPLOAD] File uploaded successfully to bucket');

      // 4. Construct Public URL
      // The path in the bucket is 'path'. The public URL depends on bucket config.
      // For private buckets, we might need a signed GET URL, but for now let's assume
      // the backend will generate a signed URL for reading or we use the persistent token approach.
      // Wait, if the bucket is private, we can't just guess the URL.
      // BUT, we are storing this URL in the User profile.
      // If the bucket is private, the Image component won't be able to load it either!
      
      // Firebase Storage usually creates "download tokens" for public access.
      // With Signed URLs, we are bypassing that.
      // If we want the image to be viewable, we either need:
      // a) Public bucket (read-only)
      // b) Signed URLs for reading (generated on demand)
      // c) Firebase's "getDownloadURL" equivalent?
      
      // Let's assume for now we construct the storage.googleapis.com URL.
      // AND we need to make sure the bucket allows public reads.
      // If not, we are stuck again.
      
      // ALTERNATIVE: Use `getDownloadURL` from firebase-storage SDK?
      // No, that requires the client to be authenticated (which caused the issue).
      
      // So, the bucket MUST be public for reads, or we generate signed URLs for reads too.
      // For profile pictures, public read is usually fine.
      
      // Constructing the URL manually:
      const { firebaseConfig } = require('../firebase/firebase.config');
      // Use appspot.com bucket name (actual existing bucket)
      const bucketName = 'mobile-based-bus-ticket.appspot.com';
      const encodedPath = encodeURIComponent(path);
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
      
      return downloadURL;

    } catch (error: any) {
      console.error('❌ Failed to upload image wrapper:', error);
      throw error;
    }
  }

  /**
   * Deletes a file from Firebase Storage
   * @param path Storage path to delete
   */
  async deleteFile(path: string): Promise<void> {
    if (!firebaseStorage) return;
    
    try {
      const storageRef = ref(firebaseStorage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Generates a unique filename for profile pictures
   * @param userId User ID
   * @param extension File extension (default: jpg)
   */
  getProfilePicturePath(userId: string, extension: string = 'jpg'): string {
    const timestamp = Date.now();
    return `profile-pictures/${userId}-${timestamp}.${extension}`;
  }
}

export const firebaseStorageService = new FirebaseStorageService();
