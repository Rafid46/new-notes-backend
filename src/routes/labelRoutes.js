import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createLabel,
  getLabels,
  getLabelById,
  updateLabel,
  deleteLabel,
  setNoteLabel,
} from "../controllers/labelController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create-label", createLabel);
router.get("/get-labels", getLabels);
router.get("/get-by-id/:id", getLabelById);
router.put("/update-label/:id", updateLabel);
router.delete("/delete-label/:id", deleteLabel);
router.patch("/set-note-label", setNoteLabel);

export default router;
