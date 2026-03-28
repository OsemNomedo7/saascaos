/**
 * storage.js — Módulo unificado de upload
 *
 * Imagens (avatar, banner, thumbnail) → Cloudinary (via SDK direto)
 * Arquivos de conteúdo (ZIPs, EXEs, PDFs, vídeos) → Cloudflare R2
 *
 * Estratégia para imagens: multer.memoryStorage() + cloudinary.uploader.upload_stream()
 * Isso evita problemas de compatibilidade entre multer-storage-cloudinary e cloudinary v1.
 *
 * Fallback: disco local se credenciais não configuradas
 */

const multer   = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Cloudinary ──────────────────────────────────────────────────────────────

const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[storage] ✓ Cloudinary pronto:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('[storage] ✗ Cloudinary não configurado — fallback: disco local');
}

// ─── Cloudflare R2 ───────────────────────────────────────────────────────────

const useR2 = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

let r2Client = null;
if (useR2) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  console.log('[storage] ✓ Cloudflare R2 pronto, bucket:', process.env.R2_BUCKET_NAME);
} else {
  console.log('[storage] ✗ R2 não configurado — fallback: disco local');
}

// ─── Disco local (fallback) ───────────────────────────────────────────────────

function localDiskStorage() {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) =>
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  });
}

// ─── imageUpload() ────────────────────────────────────────────────────────────
// Retorna instância do multer para imagens.
// Se Cloudinary configurado: usa memoryStorage (buffer) e depois uploadamos via SDK.
// Se não: salva em disco diretamente.

function imageUpload() {
  if (useCloudinary) {
    // memoryStorage → buffer fica em req.file.buffer → enviamos para Cloudinary em seguida
    return multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    });
  }
  return multer({
    storage: localDiskStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });
}

// ─── uploadImageToCloudinary() ────────────────────────────────────────────────
// Faz o upload do buffer (req.file.buffer) para o Cloudinary.
// Retorna a URL pública da imagem (secure_url).
// Deve ser chamado DEPOIS do middleware imageUpload().

async function uploadImageToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'elite-trojan/images',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error('[storage] Cloudinary upload error:', error);
          return reject(error);
        }
        console.log('[storage] Cloudinary upload OK:', result.secure_url);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

// ─── processImageUpload() ─────────────────────────────────────────────────────
// Handler unificado: se Cloudinary → sobe o buffer; se não → retorna URL local.
// Retorna a URL final da imagem.

async function processImageUpload(file) {
  if (useCloudinary && file.buffer) {
    return uploadImageToCloudinary(file.buffer);
  }
  // Disco local
  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${base}/uploads/${file.filename}`;
}

// ─── fileUpload() ─────────────────────────────────────────────────────────────
// Para arquivos de conteúdo (ZIPs, EXEs, PDFs, etc.) → Cloudflare R2.

function fileUpload() {
  if (useR2) {
    const storage = multerS3({
      s3:     r2Client,
      bucket: process.env.R2_BUCKET_NAME,
      // R2 não suporta ACL — acesso público configurado nas settings do bucket
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `files/${uuidv4()}${ext}`);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    });
    return multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });
  }

  // Fallback: Cloudinary raw (se só Cloudinary configurado)
  if (useCloudinary) {
    return multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    });
  }

  return multer({
    storage: localDiskStorage(),
    limits: { fileSize: 500 * 1024 * 1024 },
  });
}

// ─── processFileUpload() ──────────────────────────────────────────────────────
// Handler unificado para arquivos de conteúdo.

async function processFileUpload(file) {
  // R2 via multer-s3: URL em file.location
  if (useR2 && file.location) return file.location;

  // Cloudinary raw fallback (quando R2 não configurado)
  if (useCloudinary && file.buffer) {
    return new Promise((resolve, reject) => {
      const ext = path.extname(file.originalname);
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'elite-trojan/files',
          resource_type: 'raw',
          public_id: uuidv4() + ext,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Disco local
  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${base}/uploads/${file.filename}`;
}

// Legado: getFileUrl para rotas que ainda usam o padrão antigo (R2 via multer-s3)
function getFileUrl(file) {
  if (file.location && file.location.startsWith('http')) return file.location;
  if (file.path && file.path.startsWith('http'))         return file.path;
  if (file.secure_url)                                   return file.secure_url;
  const base = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${base}/uploads/${file.filename}`;
}

module.exports = {
  imageUpload,
  fileUpload,
  processImageUpload,
  processFileUpload,
  getFileUrl,
  useCloudinary,
  useR2,
};
