/**
 * storage.js — Módulo unificado de upload
 *
 * Imagens (avatar, banner, thumbnail):
 *   1. Salva em disco local primeiro (sempre funciona)
 *   2. Tenta subir para Cloudinary
 *   3. Se Cloudinary falhar, usa URL do disco local como fallback
 *
 * Arquivos de conteúdo (ZIPs, EXEs, PDFs, vídeos):
 *   1. Tenta Cloudflare R2 (se configurado e credenciais válidas)
 *   2. Fallback: Cloudinary raw
 *   3. Fallback final: disco local
 */

const multer   = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');

// Garante que o diretório de uploads existe
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Cloudinary ───────────────────────────────────────────────────────────────

const cloudName   = process.env.CLOUDINARY_CLOUD_NAME   || '';
const cloudApiKey = process.env.CLOUDINARY_API_KEY      || '';
const cloudSecret = process.env.CLOUDINARY_API_SECRET   || '';

const useCloudinary = !!(
  cloudName && !cloudName.startsWith('your_') &&
  cloudApiKey && !cloudApiKey.startsWith('your_') &&
  cloudSecret && !cloudSecret.startsWith('your_')
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key:    cloudApiKey,
    api_secret: cloudSecret,
  });
  console.log('[storage] ✓ Cloudinary configurado:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('[storage] ✗ Cloudinary não configurado — usando disco local');
}

// ─── Cloudflare R2 ────────────────────────────────────────────────────────────

// R2 Access Key ID deve ter exatamente 32 chars; secret deve ter ≥ 32 chars.
// Se inválidos, desabilita R2 para evitar erro de runtime.
const r2AccessKey   = process.env.R2_ACCESS_KEY_ID    || '';
const r2SecretKey   = process.env.R2_SECRET_ACCESS_KEY || '';
const r2AccountId   = process.env.R2_ACCOUNT_ID        || '';
const r2PublicUrl   = process.env.R2_PUBLIC_URL         || '';
const r2AccessValid = r2AccessKey.length >= 20 && !r2AccessKey.startsWith('your_');
const r2SecretValid = r2SecretKey.length >= 20 && !r2SecretKey.startsWith('your_');
// R2_PUBLIC_URL precisa ser uma URL real (sem XXXX placeholder) para servir arquivos publicamente
const r2PublicValid = r2PublicUrl.startsWith('https://') &&
  !r2PublicUrl.includes('XXXX') &&
  !r2PublicUrl.startsWith('your_');

const useR2 = process.env.DISABLE_R2 !== 'true' && !!(
  r2AccountId && !r2AccountId.startsWith('your_') &&
  r2AccessKey &&
  r2SecretKey &&
  process.env.R2_BUCKET_NAME && !process.env.R2_BUCKET_NAME.startsWith('your_') &&
  r2AccessValid &&
  r2SecretValid &&
  r2PublicValid
);

let r2Client = null;
if (useR2) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
  });
  console.log('[storage] ✓ Cloudflare R2 pronto, bucket:', process.env.R2_BUCKET_NAME);
} else if (r2AccessKey && (!r2AccessValid || !r2SecretValid)) {
  console.warn('[storage] ✗ R2: credenciais com tamanho inválido. Access Key ID deve ter ≥20 chars. Fallback para Cloudinary/disco.');
} else {
  console.log('[storage] ✗ R2 não configurado — fallback: Cloudinary/disco');
}

// ─── Disco local ──────────────────────────────────────────────────────────────

function diskStorage() {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  });
}

function localUrl(filename) {
  const base = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  return `${base}/uploads/${filename}`;
}

// ─── imageUpload() ────────────────────────────────────────────────────────────
// SEMPRE usa diskStorage — garante que o arquivo está em disco antes de tentar Cloudinary.
// Assim, se Cloudinary falhar, a URL do disco é um fallback real.

function imageUpload() {
  return multer({
    storage: diskStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  });
}

// ─── Normaliza file para disco ─────────────────────────────────────────────────
// Se o arquivo veio de memoryStorage (tem file.buffer mas não file.path),
// salva em disco temporariamente para que processImageUpload/processFileUpload
// funcionem normalmente.

function ensureDiskFile(file) {
  if (file.path && file.filename) return { diskFile: file, tempPath: null };
  if (!file.buffer) throw new Error('Arquivo sem buffer e sem path — não é possível processar.');
  const ext = path.extname(file.originalname) || '.tmp';
  const filename = `${uuidv4()}${ext}`;
  const tempPath = path.join(uploadsDir, filename);
  fs.writeFileSync(tempPath, file.buffer);
  return { diskFile: { ...file, path: tempPath, filename }, tempPath };
}

// ─── processImageUpload() ─────────────────────────────────────────────────────
// Aceita disk storage (file.path) OU memory storage (file.buffer).
// 1. Se Cloudinary configurado: tenta subir.
// 2. Fallback: URL do disco local.

async function processImageUpload(file) {
  const { diskFile, tempPath } = ensureDiskFile(file);
  const fallbackUrl = localUrl(diskFile.filename);

  if (useCloudinary) {
    try {
      const buffer = fs.readFileSync(diskFile.path);
      const cloudUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'elite-trojan/images', resource_type: 'auto' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(buffer);
      });
      try { fs.unlinkSync(diskFile.path); } catch {}
      console.log('[storage] ✓ Imagem no Cloudinary:', cloudUrl);
      return cloudUrl;
    } catch (err) {
      console.error('[storage] ✗ Cloudinary falhou:', err.message, '— usando disco como fallback');
    }
  }

  console.log('[storage] Imagem salva localmente:', fallbackUrl);
  return fallbackUrl;
}

// ─── fileUpload() ─────────────────────────────────────────────────────────────
// Sempre salva em disco primeiro (sem limite prático), depois tenta Cloudinary.

function fileUpload() {
  if (useR2) {
    return multer({
      storage: multerS3({
        s3:     r2Client,
        bucket: process.env.R2_BUCKET_NAME,
        key: (req, file, cb) => cb(null, `files/${uuidv4()}${path.extname(file.originalname)}`),
        contentType: multerS3.AUTO_CONTENT_TYPE,
      }),
      limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
    });
  }

  // Cloudinary ou disco: salva em disco primeiro, processFileUpload decide depois
  return multer({
    storage: diskStorage(),
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
  });
}

// ─── processFileUpload() ──────────────────────────────────────────────────────
// Aceita disk storage OU memory storage.
// Detecta áudio e usa resource_type: 'video' no Cloudinary (necessário para playback).

async function processFileUpload(file) {
  // R2 via multer-s3: URL pública em file.location
  if (useR2 && file.location) {
    if (process.env.R2_PUBLIC_URL && file.key) {
      const publicBase = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
      return `${publicBase}/${file.key}`;
    }
    return file.location;
  }

  const { diskFile, tempPath } = ensureDiskFile(file);
  const fallbackUrl = localUrl(diskFile.filename);

  if (useCloudinary) {
    try {
      const buffer = fs.readFileSync(diskFile.path);
      const mime = diskFile.mimetype || '';
      const isAudio = mime.startsWith('audio/');
      const isVideo = mime.startsWith('video/');
      // Cloudinary: áudio e vídeo usam resource_type 'video'; outros ficam 'raw'
      const resourceType = (isAudio || isVideo) ? 'video' : 'raw';
      const ext = path.extname(diskFile.originalname);
      const cloudUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'elite-trojan/files', resource_type: resourceType, public_id: uuidv4() + ext },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(buffer);
      });
      try { fs.unlinkSync(diskFile.path); } catch {}
      console.log('[storage] ✓ Arquivo no Cloudinary:', cloudUrl);
      return cloudUrl;
    } catch (err) {
      console.error('[storage] ✗ Cloudinary falhou para arquivo:', err.message, '— usando disco');
    }
  }

  console.log('[storage] Arquivo salvo localmente:', fallbackUrl);
  return fallbackUrl;
}

// ─── getFileUrl() ─────────────────────────────────────────────────────────────

function getFileUrl(file) {
  if (file.location && file.location.startsWith('http')) return file.location;
  if (file.path     && file.path.startsWith('http'))     return file.path;
  if (file.secure_url)                                   return file.secure_url;
  return localUrl(file.filename);
}

module.exports = {
  imageUpload,
  fileUpload,
  processImageUpload,
  processFileUpload,
  getFileUrl,
  useCloudinary,
  useR2,
  r2Client,
};
