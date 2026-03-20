import { s3Client } from '../libs/s3Client';
import multer, { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { ExpressRequest, S3_BUCKET_NAME } from './constants';


// 1. S3 저장소 설정 (기존 multer.diskStorage 대신 multerS3를 쓴 것 뿐)
const storage = multerS3({
  s3: s3Client, 
  bucket: S3_BUCKET_NAME, 
  // multerS3가 업로드할 때 파일의 확장자를 보고 **"이건 image/jpeg야!"**라고 S3에 미리 꼬리표를 붙여줌.
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => { // 가서 이 이름으로 저장해라.
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  },
});

// 2. 필터링 
const fileFilter = (
  req: ExpressRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => { // 앞글자가 image/로 시작하는 진짜 사진들만 통과시켜
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// 3. 미들웨어 생성 
// multer는 파일 업로드 전체 과정을 총괄하는 시스템
export const upload = multer({
  storage, // 위에서 만든 S3 storage
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

