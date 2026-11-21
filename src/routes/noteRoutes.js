import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  archiveNote,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  emptyBin,
} from "../controllers/noteController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create-note", createNote);
router.get("/get-notes", getNotes);
router.get("/get-by-id/:id", getNoteById);
router.put("/update-note/:id", updateNote);
router.patch("/archive-note/:id", archiveNote);
router.delete("/delete-note/:id", deleteNote);
router.patch("/restore-note/:id", restoreNote);
router.delete("/permanent-delete/:id", permanentDeleteNote);
router.delete("/empty-bin", emptyBin);

export default router;
