import multer from "multer";
import { env } from "../../env.js";
import { EXTENSION_BY_MIME, isAllowedMime } from "../../lib/file-signature.js";
import { HttpError } from "../../lib/http-error.js";
import { ensureMonthDir, monthSegment } from "../../lib/storage.js";

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureMonthDir(monthSegment())
      .then((dir) => cb(null, dir))
      .catch((error: unknown) => cb(error as Error, ""));
  },
  filename: (_req, file, cb) => {
    // Extension comes from the declared mime whitelist, never from the
    // client's filename, so nothing user-controlled reaches the filesystem.
    cb(null, `${crypto.randomUUID()}${EXTENSION_BY_MIME[file.mimetype] ?? ""}`);
  },
});

export const uploadSingleFile = multer({
  storage: diskStorage,
  // The larger cap applies here; the per-kind limit is enforced after sniffing.
  limits: { fileSize: env.maxVideoBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedMime(file.mimetype)) {
      cb(new HttpError(415, `Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
}).single("file");
