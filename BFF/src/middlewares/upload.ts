import multer from "multer";

/** Maximum resumes allowed per batch request */
export const MAX_BATCH_FILES = 10;

export const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: MAX_BATCH_FILES,
  },

  fileFilter(req, file, cb) {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Only PDF and Word documents are allowed."));
  },
});

