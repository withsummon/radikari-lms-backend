import { AwsClient } from "aws4fetch";

type UploadResult = {
  url: string;
  key: string;
  etag?: string;
};

type BucketConfig = {
  name: string;
  publicUrl: string;
};

const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const accountId = process.env.R2_ACCOUNT_ID || "";
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const bucketConfig: BucketConfig = {
  name: process.env.R2_BUCKET_NAME || "",
  publicUrl: process.env.R2_PUBLIC_URL || "",
};

const isR2Configured = !!(
  accessKeyId &&
  secretAccessKey &&
  accountId &&
  bucketConfig.name &&
  bucketConfig.publicUrl
);

const s3 = isR2Configured
  ? new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    })
  : null;

export class R2Upload {
  private getBucketConfig(): BucketConfig {
    return bucketConfig;
  }

  async uploadImage(
    file: File | Blob, 
    options?: {
      fileName?: string;
      folderType?: string; 
    }
  ): Promise<UploadResult> {
    if (!(isR2Configured && s3)) {
      throw new Error("R2 credentials are not configured");
    }

    const { fileName, folderType } = options ?? {};
    const bucketConfig = this.getBucketConfig();
    
    let folderPrefix = "";
    if (folderType) {
        folderPrefix = folderType.endsWith('/') ? folderType : `${folderType}/`;
        if (folderPrefix.startsWith('/')) folderPrefix = folderPrefix.substring(1);
    }
    
    const finalFileName = fileName || (file instanceof File ? file.name : "upload.bin");
    const key = `${folderPrefix}${finalFileName}`;

    const buffer = await file.arrayBuffer();

    try {
      const response = await s3.fetch(
        `${endpoint}/${bucketConfig.name}/${key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "Content-Length": buffer.byteLength.toString(),
          },
          body: buffer,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const etag = response.headers.get("etag") || undefined;
      const imageUrl = `${bucketConfig.publicUrl}/${key}`;

      return {
        url: imageUrl,
        key,
        etag,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    if (!(isR2Configured && s3)) {
      throw new Error("R2 credentials are not configured");
    }

    const bucketConfig = this.getBucketConfig();

    try {
      const response = await s3.fetch(
        `${endpoint}/${bucketConfig.name}/${key}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  validateImageFile(file: File): { isValid: boolean; error?: string } {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
           return {
            isValid: false,
            error: "File size too large. Maximum size is 5MB.",
          };
      }
      return { isValid: true };
  }
}

export const r2Upload = new R2Upload();
