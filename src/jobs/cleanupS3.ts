import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prismaClient } from "../libs/constants";
import { s3Client } from "../libs/s3Client";
import { S3_BUCKET_NAME } from "../libs/constants";

export async function cleanupS3Files() {
  console.log(`[BATCH:S3] 청소 시작 - ${new Date().toISOString()}`);

  const targets = await prismaClient.deletedFile.findMany({
    take: 100,
    orderBy: { createdAt: 'asc' },
  });

  // 삭제할 파일이 없는 경우. 바로 return
  if (targets.length === 0) {
    console.log('[BATCH:S3] 삭제할 대상이 없습니다.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const target of targets) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: target.fileKey,
      }));

      await prismaClient.deletedFile.delete({
        where: { id: target.id },
      });
      
      successCount++;
    } catch (err) {
      console.error(`[BATCH:S3] 삭제 실패 (Key: ${target.fileKey}):`, err);
      failCount++;
    }
  }

  console.log(`작업 완료 (성공: ${successCount}, 실패: ${failCount})`);
}

