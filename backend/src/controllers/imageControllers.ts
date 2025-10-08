import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import { Request, Response } from "express";
import { Metadata } from "../db/schema";
import { Types } from "mongoose";

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});

const generateImageName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = (req as any).userId; // depends on how your auth middleware attaches it
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const uniqueKey = generateImageName();
    const ext = file.mimetype.split("/")[1] || "bin";

    const imageKey = `${uniqueKey}.${ext}`;
    const thumbnailKey = `${uniqueKey}-thumbnail.webp`;

    // Generate thumbnail buffer
    const thumbnailBuffer = await sharp(file.buffer)
      .resize({ width: 100, height: 100, fit: "cover" })
      .webp({ quality: 70 })
      .toBuffer();

    const uploadOriginal = s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName!,
        Body: file.buffer,
        Key: imageKey,
        ContentType: file.mimetype,
      })
    );

    const uploadThumbnail = s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName!,
        Body: thumbnailBuffer,
        Key: thumbnailKey,
        ContentType: "image/webp",
      })
    );

    await Promise.all([uploadOriginal, uploadThumbnail]);

    const metadata = await Metadata.create({
      name: file.originalname,
      size: file.size,
      s3Key: imageKey,
      thumbnail: `https://${bucketName}.s3.${region}.amazonaws.com/${thumbnailKey}`,
      original: `https://${bucketName}.s3.${region}.amazonaws.com/${imageKey}`,
      user: userId,
    });

    return res.status(200).json({
      message: "File uploaded successfully",
      metadata,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const imageKey = req.body.s3key;
    if (!imageKey) {
      return res.status(400).json({ message: "No image key provided" });
    }

    // Make sure the field matches your schema (e.g., 'original' instead of 's3Key')
    const metadata = await Metadata.findOne({
      s3Key: imageKey,
      user: Types.ObjectId.createFromHexString(userId),
    });

    if (!metadata) {
      return res.status(404).json({ message: "Image not found" });
    }

    const deleteOriginal = s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName!,
        Key: metadata.s3Key,
      })
    );

    const deleteThumbnail = s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName!,
        Key: `${metadata.s3Key.split(".")[0]}-thumbnail.webp`,
      })
    );

    await Promise.all([deleteOriginal, deleteThumbnail]);

    await Metadata.deleteOne({
      s3Key: imageKey,
      user: Types.ObjectId.createFromHexString(userId),
    });

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error: any) {
    console.error("Delete image error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
