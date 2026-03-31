// src/config/s3Client.ts
import { S3Client } from "@aws-sdk/client-s3";
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "./constants";

const s3Config: any = {
  region: AWS_REGION,
};

// .env에 키가 적혀 있을 때만(로컬 환경) 수동으로 넣어줌.
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
} 
// 만약 위 if문에 안 걸리면(서버 환경), AWS SDK는 자동으로 
// EC2에 부여된 'IAM Role'을 찾아서 권한을 획득.

export const s3Client = new S3Client(s3Config);