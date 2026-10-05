import express from "express";
import { createUser, getUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/create-user", createUser);
router.get("/:id", getUser);

export default router;
