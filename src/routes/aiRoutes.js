import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { convertAndCreateNote } from "../controllers/aiController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/convert", upload.single("file"), convertAndCreateNote);

export default router;

