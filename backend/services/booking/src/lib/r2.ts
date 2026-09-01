import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { loadEnv } from "./env";

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!client) {
    const env = loadEnv();
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    });
  }
  return client;
}

export async function presignUpload(key: string, contentType: string): Promise<string> {
  const env = loadEnv();
  const command = new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(getR2Client(), command, { expiresIn: 300 });
}

export async function presignDownload(key: string): Promise<string> {
  const env = loadEnv();
  const command = new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key });
  return getSignedUrl(getR2Client(), command, { expiresIn: 60 * 15 });
}

export async function deleteObjects(keys: string[]): Promise<void> {
  const env = loadEnv();
  await Promise.all(
    keys.map((key) => getR2Client().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key })).catch(() => undefined))
  );
}

export function publicUrl(key: string): string {
  const env = loadEnv();
  return `${env.R2_PUBLIC_BASE_URL}/${key}`;
}
