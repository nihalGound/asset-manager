import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware";
import { deleteImage, uploadImage } from "../controllers/imageControllers";
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", authMiddleware, upload.single("image"), uploadImage);
router.delete("/delete", authMiddleware, deleteImage);
