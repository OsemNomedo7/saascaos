const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ----- Helpers -----

function getLocalDiskStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  });
}

/**
 * Returns a multer instance for IMAGE uploads.
 * Uses Cloudinary when credentials are present, otherwise local disk.
 */
function imageUpload() {
  const storage = useCloudinary
    ? new CloudinaryStorage({
        cloudinary,
        params: {
          folder: 'elite-trojan/images',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico'],
        },
      })
    : getLocalDiskStorage('uploads/');

  return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
}

/**
 * Returns a multer instance for ANY FILE uploads (content files).
 * Uses Cloudinary with resource_type=raw when credentials are present.
 */
function fileUpload() {
  const storage = useCloudinary
    ? new CloudinaryStorage({
        cloudinary,
        params: {
          folder: 'elite-trojan/files',
          resource_type: 'raw',
        },
      })
    : getLocalDiskStorage('uploads/');

  return multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });
}

/**
 * Extracts the public URL from a multer file object.
 * Cloudinary returns the URL in req.file.path; local disk uses BACKEND_URL + filename.
 */
function getFileUrl(file) {
  if (useCloudinary) {
    return file.path; // Cloudinary URL (https://res.cloudinary.com/...)
  }
  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${base}/uploads/${file.filename}`;
}

module.exports = { imageUpload, fileUpload, getFileUrl, cloudinary, useCloudinary };
