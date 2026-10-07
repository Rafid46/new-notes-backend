import express from "express";
import {
  createUser,
  getUser,
  loginUser,
  refreshToken,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-user", createUser);
router.post("/login", loginUser);
router.post("/refreshToken", refreshToken);
router.get("/:id", authMiddleware, getUser);

export default router;
