<!--
  ============================================================
  README DRAFT 3 — 팀원별 기여 문서형
  컨셉: QuickStart 먼저 + 팀원별 상세 구현 내역 + 비즈니스 룰
  참고: nb05-Welive-team2
  포인트: 각 팀원이 뭘 만들었는지 구체적으로 보여주는 포트폴리오형
  ============================================================
-->

# WeLive - 아파트 통합 관리 플랫폼

> Node.js 백엔드 + Next.js 프론트엔드 | 아파트 입주민·관리자·슈퍼관리자 올인원 서비스

<br />

## QuickStart

```bash
git clone https://github.com/GeonSoon1/nb-06-welive-team5.git
cd nb-06-welive-team5

# 1. 환경변수 설정
cp .env.example .env
# DATABASE_URL, JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET,
# AWS_REGION, S3_BUCKET_NAME 등 설정

# 2. 백엔드
npm install
npx prisma migrate dev      # DB 마이그레이션
npm run db:seed              # 초기 데이터 (Super Admin 등)
npm run dev                  # http://localhost:8080

# 3. 프론트엔드 (별도 터미널)
cd front-end
npm install
npm run dev                  # http://localhost:3000
```

<br />

---

## 팀원 구성

| 이름 | 역할 | GitHub | 블로그 |
|------|------|--------|--------|
| 팀원1 | 담당 모듈 A | [GitHub](https://github.com/팀원1) | [Blog](https://your-blog-1.com) |
| 팀원2 | 담당 모듈 B | [GitHub](https://github.com/팀원2) | [Blog](https://your-blog-2.com) |
| 팀원3 | 담당 모듈 C | [GitHub](https://github.com/팀원3) | [Blog](https://your-blog-3.com) |

<br />

---

## 프로젝트 소개

| 항목 | 내용 |
|------|------|
| 프로젝트명 | WeLive (위리브) |
| 주제 | 아파트 입주민 통합 관리 플랫폼 |
| 개발 기간 | 2026.03.04 ~ 2026.04.01 (4주) |
| 노션 | [팀 노션 링크](https://your-notion-url.com) |

**WeLive**는 아파트 단지의 세 역할(입주민·관리자·슈퍼관리자)이 하나의 플랫폼에서 소통하고 관리하는 멀티테넌트 커뮤니티 서비스입니다.

<br />

---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Backend | Node.js 20, TypeScript 5.8, Express 4.19 |
| Database | PostgreSQL 16, Prisma ORM 6.18 |
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Zustand |
| 인증 | JWT (Access + Refresh Token), bcrypt, HTTP-Only Cookie |
| 파일 저장 | AWS S3 (multer-s3) |
| 실시간 | Server-Sent Events (SSE) |
| 검증 | Superstruct (Backend), Zod + React Hook Form (Frontend) |
| 모니터링 | Sentry |
| 스케줄링 | node-cron (투표 상태 전환, S3 파일 정리) |
| 테스트 | Jest, Supertest, ts-jest |
| CI/CD | GitHub Actions, Blue-Green 배포 (EC2 x4, ALB) |
| 일정 관리 | Notion, GitHub Projects |
| Git 전략 | main / dev / feature-* / fix-* / refactor-* |

<br />

---

## 팀원별 구현 기능

---

<!--
  TODO: 팀원별 담당 모듈을 실제에 맞게 채워주세요.
  아래는 프로젝트 구현 내용을 3명 기준으로 재분배한 예시입니다.
  비즈니스 룰, 인가 규칙, 플로우 다이어그램은 실제 담당에 맞게 이동시켜주세요.
-->

### 🟦 팀원1 — 담당 모듈 A

**담당 모듈**: `모듈1`, `모듈2`

<br />

#### 기능 1

**비즈니스 룰:**
- 규칙 1
- 규칙 2
- 규칙 3

**인가 규칙:**
| 작업 | 권한 | 아파트 검증 |
|------|------|------------|
| 예시 | ADMIN, SUPER_ADMIN | O |

<!-- TODO: 스크린샷 추가 -->
<!-- <img src="./docs/images/팀원1-feature1.png" alt="기능1" width="600" /> -->

<br />

#### 기능 2

**비즈니스 룰:**
- 규칙 1
- 규칙 2

```
[플로우 다이어그램 예시]
요청 → 검증 → 처리 → 응답
```

<!-- TODO: 스크린샷 추가 -->

---

### 🟩 팀원2 — 담당 모듈 B

**담당 모듈**: `모듈3`, `모듈4`

<br />

#### 기능 1

**비즈니스 룰:**
- 규칙 1
- 규칙 2

**인가 규칙:**
| 작업 | 권한 | 아파트 검증 |
|------|------|------------|
| 예시 | 인증된 사용자 | O |

<!-- TODO: 스크린샷 추가 -->

<br />

#### 기능 2

**비즈니스 룰:**
- 규칙 1
- 규칙 2

```
[플로우 다이어그램 예시]
요청 → 검증 → 처리 → 응답
```

<!-- TODO: 스크린샷 추가 -->

---

### 🟧 팀원3 — 담당 모듈 C

**담당 모듈**: `모듈5`, `모듈6`

<br />

#### 기능 1

**비즈니스 룰:**
- 규칙 1
- 규칙 2

**인가 규칙:**
| 작업 | 권한 | 아파트 검증 |
|------|------|------------|
| 예시 | ADMIN, SUPER_ADMIN | O |

<!-- TODO: 스크린샷 추가 -->

<br />

#### 기능 2

**비즈니스 룰:**
- 규칙 1
- 규칙 2

```
[플로우 다이어그램 예시]
요청 → 검증 → 처리 → 응답
```

<!-- TODO: 스크린샷 추가 -->

---

## API 엔드포인트 전체 목록

<details>
<summary><b>인증 (Auth) — 13개 엔드포인트</b></summary>

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| POST | `/api/auth/signup` | - | - | 일반 사용자 회원가입 |
| POST | `/api/auth/signup/admin` | - | - | 관리자 + 아파트 등록 |
| POST | `/api/auth/signup/super-admin` | O | SUPER_ADMIN | 슈퍼관리자 등록 |
| POST | `/api/auth/login` | - | - | 로그인 |
| POST | `/api/auth/logout` | O | - | 로그아웃 |
| POST | `/api/auth/refresh` | - | - | 토큰 갱신 |
| PATCH | `/api/auth/admins/status` | O | SUPER_ADMIN | 관리자 일괄 승인/거절 |
| PATCH | `/api/auth/admins/:adminId/status` | O | SUPER_ADMIN | 관리자 단건 승인/거절 |
| PATCH | `/api/auth/admins/:adminId` | O | SUPER_ADMIN | 관리자 정보 수정 |
| DELETE | `/api/auth/admins/:adminId` | O | SUPER_ADMIN | 관리자 + 아파트 삭제 |
| PATCH | `/api/auth/residents/:residentId/status` | O | ADMIN | 입주민 승인 |
| PATCH | `/api/auth/residents/status` | O | ADMIN | 입주민 일괄 승인 |
| POST | `/api/auth/cleanup` | O | SUPER_ADMIN, ADMIN | 거절 계정 정리 |

</details>

<details>
<summary><b>아파트 (Apartments) — 4개 엔드포인트</b></summary>

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/apartments/public` | - | - | 아파트 목록 (공개) |
| GET | `/api/apartments/public/:id` | - | - | 아파트 상세 (공개) |
| GET | `/api/apartments` | O | Role별 분기 | 아파트 목록 |
| GET | `/api/apartments/:id` | O | Role별 분기 | 아파트 상세 |

</details>

<details>
<summary><b>입주민 (Residents) — 9개 엔드포인트</b></summary>

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/residents` | O | ADMIN, SUPER_ADMIN | 입주민 목록 |
| POST | `/api/residents` | O | ADMIN, SUPER_ADMIN | 입주민 등록 |
| GET | `/api/residents/:residentId` | O | ADMIN, SUPER_ADMIN | 입주민 상세 |
| PATCH | `/api/residents/:residentId` | O | ADMIN, SUPER_ADMIN | 입주민 수정 |
| DELETE | `/api/residents/:residentId` | O | ADMIN, SUPER_ADMIN | 입주민 삭제 |
| POST | `/api/residents/from-file` | O | ADMIN, SUPER_ADMIN | CSV 일괄 등록 |
| POST | `/api/residents/from-users/:userId` | O | ADMIN, SUPER_ADMIN | 유저 연동 |
| GET | `/api/residents/file/template` | O | ADMIN, SUPER_ADMIN | CSV 템플릿 |
| GET | `/api/residents/file` | O | ADMIN, SUPER_ADMIN | CSV 내보내기 |

</details>

<details>
<summary><b>공지 / 투표 / 민원 / 댓글 / 알림 / 이벤트 — 24개 엔드포인트</b></summary>

| Method | Endpoint | Auth | 설명 |
|--------|----------|:----:|------|
| GET | `/api/notices` | O | 공지 목록 |
| POST | `/api/notices` | O | 공지 작성 (ADMIN) |
| GET | `/api/notices/:noticeId` | O | 공지 상세 |
| PATCH | `/api/notices/:noticeId` | O | 공지 수정 (ADMIN) |
| DELETE | `/api/notices/:noticeId` | O | 공지 삭제 (ADMIN) |
| GET | `/api/polls` | O | 투표 목록 |
| POST | `/api/polls` | O | 투표 생성 (ADMIN) |
| GET | `/api/polls/:pollId` | O | 투표 상세 |
| PATCH | `/api/polls/:pollId` | O | 투표 수정 (ADMIN) |
| DELETE | `/api/polls/:pollId` | O | 투표 삭제 (ADMIN) |
| POST | `/api/options/:optionId/vote` | O | 투표하기 |
| DELETE | `/api/options/:optionId/vote` | O | 투표 취소 |
| GET | `/api/complaints` | O | 민원 목록 |
| POST | `/api/complaints` | O | 민원 등록 |
| GET | `/api/complaints/:complaintId` | O | 민원 상세 |
| PATCH | `/api/complaints/:complaintId` | O | 민원 수정 (작성자) |
| DELETE | `/api/complaints/:complaintId` | O | 민원 삭제 (작성자) |
| PATCH | `/api/complaints/:complaintId/status` | O | 민원 상태 변경 (ADMIN) |
| POST | `/api/comments` | O | 댓글 작성 |
| PATCH | `/api/comments/:commentId` | O | 댓글 수정 |
| DELETE | `/api/comments/:commentId` | O | 댓글 삭제 |
| GET | `/api/notifications/sse` | O | 실시간 알림 (SSE) |
| PATCH | `/api/notifications/:id/read` | O | 알림 읽음 |
| GET | `/api/event` | O | 캘린더 이벤트 |
| PUT | `/api/event` | O | 이벤트 생성 (ADMIN) |
| DELETE | `/api/event/:eventId` | O | 이벤트 삭제 (ADMIN) |

</details>

<details>
<summary><b>사용자 (Users) — 2개 엔드포인트</b></summary>

| Method | Endpoint | Auth | 설명 |
|--------|----------|:----:|------|
| PATCH | `/api/users/me` | O | 프로필 이미지 변경 |
| PATCH | `/api/users/password` | O | 비밀번호 변경 |

</details>

<br />

---

## 프로젝트 구조

<details>
<summary><b>전체 폴더 구조 펼치기</b></summary>

```
nb-06-welive-team5/
├── src/
│   ├── main.ts                    # Express 앱 진입점
│   ├── middlewares/
│   │   ├── authenticate.ts        # JWT 인증
│   │   └── authorize.ts           # Role 기반 인가
│   ├── libs/
│   │   ├── auth/                  # JWT 토큰 / 쿠키 관리
│   │   ├── errors/                # 에러 핸들러 + 커스텀 에러
│   │   ├── constants.ts           # 환경변수 / 상수
│   │   ├── corsSetup.ts           # CORS 설정
│   │   ├── s3Client.ts            # AWS S3 클라이언트
│   │   └── storage.ts             # Multer + S3 스토리지
│   │
│   ├── auth/                      # 🟦 팀원1
│   │   ├── auth.router.ts
│   │   ├── auth.controller.ts
│   │   ├── services/
│   │   └── auth.repository.ts
│   ├── users/                     # 🟦 팀원1
│   │
│   ├── residents/                 # 🟩 팀원2
│   ├── complaints/                # 🟩 팀원2
│   │
│   ├── polls/                     # 🟧 팀원3
│   ├── pollsvote/                 # 🟧 팀원3
│   ├── pollScheduler/             # 🟧 팀원3
│   ├── notifications/             # 🟧 팀원3
│   │
│   ├── notices/                   # 🟧 팀원3
│   ├── events/                    # 🟧 팀원3
│   ├── comments/                  # 🟧 팀원3
│   ├── apartments/                # 공통
│   └── jobs/                      # Cron (투표 상태, S3 정리)
│
├── front-end/                     # Next.js 프론트엔드
│   └── src/
│       ├── application/           # 앱 로직 + 스토어
│       ├── entities/              # 데이터 모델
│       ├── features/              # 기능 컴포넌트
│       ├── pages/                 # 라우트
│       ├── shared/                # 공통 훅/유틸
│       └── widgets/               # UI 위젯
│
├── prisma/
│   ├── schema.prisma              # DB 스키마 (14개 모델)
│   ├── seed.ts                    # 초기 데이터
│   └── migrations/                # 마이그레이션 히스토리
│
├── test/                          # 테스트 코드
│   ├── *.api.test.ts              # API 통합 테스트
│   └── *.services.test.ts         # 서비스 단위 테스트
│
├── .github/workflows/
│   └── deploy.yml                 # Blue-Green 배포 파이프라인
│
└── types/
    └── express.d.ts               # req.user 타입 확장
```

</details>

<br />

---

## 환경변수

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/welive

# Server
NODE_ENV=development
PORT=8080

# JWT
JWT_ACCESS_TOKEN_SECRET=your-access-secret
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret

# AWS S3
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=your-bucket
AWS_ACCESS_KEY_ID=your-key           # EC2에서는 IAM Role 사용 시 불필요
AWS_SECRET_ACCESS_KEY=your-secret    # EC2에서는 IAM Role 사용 시 불필요

# Sentry (선택)
SENTRY_DSN=your-sentry-dsn

# 관리자 연락처
SUPPORT_CONTACT=010-1234-5678
```

<br />

---

## 테스트

```bash
npm run test          # 전체 테스트 실행 + 커버리지 리포트
npm run typecheck     # TypeScript 타입 검사
```

**테스트 파일 구성:**

| 모듈 | API 통합 테스트 | 서비스 단위 테스트 |
|------|:--------------:|:-----------------:|
| Auth | auth.api.test.ts | - |
| User | user.api.test.ts | - |
| Resident | - | - |
| Notice | notice.api.test.ts | notice.services.test.ts |
| Poll | poll.api.test.ts | poll.services.test.ts |
| PollVote | pollvote.api.test.ts | pollvote.services.test.ts |
| Complaint | complaint.api.test.ts | complaint.services.test.ts |
| Comment | comment.api.test.ts | comment.services.test.ts |
| Notification | notification.api.test.ts | - |
| Event | event.api.test.ts | - |
| Apartment | apartment.api.test.ts | - |
| PollScheduler | poll-Scheduler.api.test.ts | - |

<br />

---

<div align="center">

**WeLive** &copy; 2026 Team 5

</div>
