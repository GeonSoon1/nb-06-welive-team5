import { S3Client } from "@aws-sdk/client-s3";
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "./constants";


// S3Client는 AWS에서 공식적으로 만든 **통신 도구(클래스)**
export const s3Client = new S3Client({
  region: AWS_REGION, //지역
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,// 아이디
    secretAccessKey: AWS_SECRET_ACCESS_KEY, // 비밀번호
  },
});