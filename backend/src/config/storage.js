/**
 * storage.js — Unified upload module
 *
 * Images (avatar, banner, thumbnail) → Cloudinary
 * Content files (ZIPs, EXEs, PDFs, vídeos, etc.) → Cloudflare R2
 *
 * Fallback: local disk if credentials not configured (dev only)
 */

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Cloudinary (images) ────────────────────────────────────────────────────

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

// ─── Cloudflare R2 (content files) ─────────────────────────────────────────

const useR2 =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME;

let r2Client = null;
if (useR2) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// ─── Local disk fallback ────────────────────────────────────────────────────

function localDiskStorage() {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) =>
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  });
}

// ─── imageUpload() — Cloudinary ─────────────────────────────────────────────

function imageUpload() {
  const storage = useCloudinary
    ? new CloudinaryStorage({
        cloudinary,
        params: {
          folder: 'elite-trojan/images',
          resource_type: 'image',
          // aceita qualquer formato de imagem
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico'],
        },
      })
    : localDiskStorage();

  return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
}

// ─── fileUpload() — Cloudflare R2 ───────────────────────────────────────────

function fileUpload() {
  if (useR2) {
    const storage = multerS3({
      s3: r2Client,
      bucket: process.env.R2_BUCKET_NAME,
      // Sem ACL — R2 usa "Public Access" configurado no bucket
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${uuidv4()}${ext}`;
        cb(null, `files/${name}`);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    });
    return multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB
  }

  // Fallback: Cloudinary raw (se R2 não configurado mas Cloudinary sim)
  if (useCloudinary) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: { folder: 'elite-trojan/files', resource_type: 'raw' },
    });
    return multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB
  }

  // Último fallback: disco local
  return multer({ storage: localDiskStorage(), limits: { fileSize: 500 * 1024 * 1024 } });
}

// ─── getFileUrl() — extrai URL pública do arquivo ───────────────────────────

function getFileUrl(file) {
  // R2: multer-s3 coloca a URL em file.location
  if (useR2 && file.location) return file.location;

  // Cloudinary: URL em file.path
  if (useCloudinary && file.path) return file.path;

  // Local disk
  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${base}/uploads/${file.filename}`;
}

module.exports = { imageUpload, fileUpload, getFileUrl };
