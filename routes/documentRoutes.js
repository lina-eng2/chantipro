const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { authRequired, allowRoles } = require("../middleware/authMiddleware");
const documentController = require("../controllers/documentController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

router.get("/:projectId", authRequired, documentController.listDocuments);

// Dépôt doc (Architecte/MOA)
router.post(
  "/:projectId/upload",
  authRequired,
  allowRoles("Architecte", "MOA"),
  upload.single("file"),
  documentController.uploadDocument
);

// Signature convention (Architecte)
router.post(
  "/:projectId/sign/:documentId",
  authRequired,
  allowRoles("Architecte"),
  documentController.signConvention
);

module.exports = router;
