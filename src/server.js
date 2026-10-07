import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import labelRoutes from "./routes/labelRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";

config();
connectDB();
const app = express();
const PORT = 5001;

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/labels", labelRoutes);
app.use("/api/notes", noteRoutes);

app.get("/hello", (req, res) => {
  res.json({ message: "hello world" });
});
const server = app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
