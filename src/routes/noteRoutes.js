import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create-note", createNote);
router.get("/get-notes/:userId", getNotes);
router.get("/get-by-id/:id", getNoteById);
router.put("/update-note/:id", updateNote);
router.delete("/delete-note/:id", deleteNote);

export default router;
