import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream } from "fs";
import { extname } from "path";

const s3 = new S3Client({
  region: process.env["AWS_REGION"] ?? "us-east-1",
});

const BUCKET = process.env["S3_BUCKET"] ?? "informate-xatrucho";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function uploadFile(
  localPath: string,
  s3Key: string
): Promise<string> {
  const ext = extname(localPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: s3Key,
      Body: createReadStream(localPath),
      ContentType: contentType,
    },
  });

  await upload.done();

  return `https://${BUCKET}.s3.${process.env["AWS_REGION"] ?? "us-east-1"}.amazonaws.com/${s3Key}`;
}

export async function uploadBuffer(
  buffer: Buffer,
  s3Key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${BUCKET}.s3.${process.env["AWS_REGION"] ?? "us-east-1"}.amazonaws.com/${s3Key}`;
}
