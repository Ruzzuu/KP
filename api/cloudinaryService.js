// ===================================
// ☁️ CLOUDINARY UPLOAD SERVICE
// ===================================
// Handles image uploads to Cloudinary instead of local storage

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} folder - Cloudinary folder name (e.g., 'news', 'certificates', 'profiles')
 * @param {string} originalname - Original filename
 * @returns {Promise<Object>} - Cloudinary upload result with secure_url
 */
export const uploadToCloudinary = async (fileBuffer, folder = 'uploads', originalname = '') => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `pergunu/${folder}`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          public_id: originalname ? originalname.split('.')[0] : undefined
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result.secure_url);
            resolve(result);
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Cloudinary delete result:', result);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extract Cloudinary public ID from URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
export const extractPublicId = (url) => {
  try {
    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/dud8vu2an/image/upload/v1234567890/pergunu/news/image.jpg
    // Returns: pergunu/news/image
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const afterUpload = parts[1];
    // Remove version and get path
    const pathParts = afterUpload.split('/').slice(1);
    const filename = pathParts[pathParts.length - 1];
    const filenameWithoutExt = filename.split('.')[0];
    
    // Reconstruct public_id with folder path
    pathParts[pathParts.length - 1] = filenameWithoutExt;
    return pathParts.join('/');
  } catch (error) {
    console.error('❌ Error extracting public ID:', error);
    return null;
  }
};

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
export const isCloudinaryConfigured = () => {
  const configured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  
  if (!configured) {
    console.warn('⚠️ Cloudinary not configured - check environment variables');
  }
  
  return configured;
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  isCloudinaryConfigured
};
