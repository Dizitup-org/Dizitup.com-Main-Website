// src/utils/cloudinary.js
// ============================================================
// CLOUDINARY CONFIG — shared upload helper
// ============================================================
// All file uploads (chat media, avatars, docs) use this module.
// Reads CLOUDINARY_* from .env
// ============================================================

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer  — file buffer from multer memoryStorage
 * @param {object} options — cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<{url: string, public_id: string, resource_type: string, format: string, bytes: number}>}
 */
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const defaults = {
      folder:        'dizitup',
      resource_type: 'auto',       // handles images + PDFs + raw files
      use_filename:  false,
      unique_filename: true,
    };
    const uploadOptions = { ...defaults, ...options };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve({
        url:           result.secure_url,
        public_id:     result.public_id,
        resource_type: result.resource_type,
        format:        result.format,
        bytes:         result.bytes,
      });
    });

    stream.end(buffer);
  });
}

module.exports = { cloudinary, uploadToCloudinary };
