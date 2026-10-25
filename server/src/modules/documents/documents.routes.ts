import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { HttpError } from "../../lib/http-error.js";
import { ensureMonthDir, monthSegment, UPLOAD_ROOT } from "../../lib/storage.js";
import { requireAuth } from "../../middleware/auth.js";

/** A story's document is a PDF and nothing else, capped at 5 MB. */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureMonthDir(monthSegment())
        .then((dir) => cb(null, dir))
        .catch((error: unknown) => cb(error as Error, ""));
    },
    filename: (_req, _file, cb) => {
      // The name is ours, never the client's, and the extension is fixed.
      cb(null, `${crypto.randomUUID()}.pdf`);
    },
  }),
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new HttpError(415, "Only PDF files can be uploaded here."));
      return;
    }
    cb(null, true);
  },
}).single("file");

export const adminDocumentsRouter = Router();

adminDocumentsRouter.use(requireAuth);

adminDocumentsRouter.post("/", upload, (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw new HttpError(400, "Choose a PDF to upload.");

    const relative = path.relative(UPLOAD_ROOT, file.path).split(path.sep).join("/");

    res.status(201).json({
      data: {
        url: `/uploads/${relative}`,
        name: file.originalname,
        size_bytes: file.size,
      },
    });
  } catch (error) {
    next(error);
  }
});
