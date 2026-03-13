import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { ExpressRequest } from './constants';

// 1. 저장 경로 설정 (process.cwd() = 루트 폴더)
const uploadPath = path.join(process.cwd(), 'public/uploads/profiles');

// 폴더가 없으면 생성
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// 2. 로컬 저장소 엔진 설정
// 파일이 들어왔을 때, Multer가 어떻게 행동해야 하는지 적어둔 매뉴얼
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지를 위해 [타임스탬프-이름] 조합
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 3. 필터링 (이미지만)
// 브라우저가 파일을 보낼 때, "이 파일은 어떤 종류입니다"라고 꼬리표를 붙여 보내는데 그걸 MIME Type
const fileFilter = (
  req: ExpressRequest,
  file: Express.Multer.File, //file안에 들어있는 정보 타입
  cb: FileFilterCallback // 정해진 규칙대로 응답
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// upload라는 미들웨어 생성 (파일 생성(이전 작업) -> fileFilter -> storage)
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, //5MB 제한
});
