import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID not set");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const BUCKET = () => process.env.R2_BUCKET_NAME ?? "juicebox-files";

/**
 * Generate a presigned URL for uploading a file to R2.
 * Client uploads directly to R2 — no file data touches our server.
 */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/**
 * Generate a presigned URL for downloading/viewing a file from R2.
 */
export async function getDownloadUrl(key: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET(),
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/**
 * Generate a unique object key for a file upload.
 */
export function generateObjectKey(
  prefix: string,
  filename: string,
): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${timestamp}-${sanitized}`;
}
