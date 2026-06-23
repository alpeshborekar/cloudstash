import multer from 'multer';

import fs from 'fs';
import path from 'path';

import { config } from '../config';

import { Errors } from '../utils/errors';

// Ensure temp upload dir exists
const tempDir = path.resolve('temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, {
    recursive: true,
  });
}

// Allowed MIME types
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',

  'application/pdf',

  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/x-msvideo',
  'video/avi',

  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',

  'text/plain',
  'text/csv',

  'application/zip',
  'application/x-zip',
  'application/x-zip-compressed',
  'application/x-compressed',
  'multipart/x-zip',

  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
]);

// Multer config
export const upload = multer({
  storage: multer.diskStorage({
    destination: (
      _req,
      _file,
      cb,
    ) => {
      cb(null, tempDir);
    },

    filename: (
      _req,
      file,
      cb,
    ) => {
      const unique =
        `${Date.now()}-${file.originalname}`;

      cb(null, unique);
    },
  }),

  limits: {
    fileSize:
      config.upload.maxFileSizeBytes,

    files: 1,

    fields: 5,
  },

  fileFilter: (
    _req,
    file,
    cb,
  ) => {
    if (
      !ALLOWED_MIME.has(
        file.mimetype,
      )
    ) {
      return cb(
        Errors.unsupported(
          `File type '${file.mimetype}' is not allowed`,
        ) as any,
      );
    }

    cb(null, true);
  },
});