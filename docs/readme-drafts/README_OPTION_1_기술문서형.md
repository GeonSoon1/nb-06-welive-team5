<!--
  ============================================================
  WeLive Team5 README 초안
  멘토가 제공하는 템플릿 — 팀원들이 스크린샷/링크를 채워 완성
  ============================================================
-->

<div align="center">

<!-- TODO: 프로젝트 배너 이미지 추가 (Figma나 Canva로 제작 권장, 1280x640px) -->
<!-- <img src="./docs/images/banner.png" alt="WeLive Banner" width="100%" /> -->

# WeLive - 아파트 통합 관리 플랫폼

**입주민, 관리자, 슈퍼관리자를 위한 올인원 아파트 커뮤니티 서비스**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)

<!-- TODO: 배포 후 실제 URL로 교체 -->
[배포 URL](https://your-deploy-url.com) | [API 문서 (Swagger)](https://your-api-docs-url.com) | [Notion](https://your-notion-url.com)

</div>

<br />

### 목차

- [프로젝트 소개](#프로젝트-소개)
- [팀원 소개](#팀원-소개)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [ERD](#erd)
- [주요 기능](#주요-기능)
- [API 명세](#api-명세)
- [프로젝트 구조](#프로젝트-구조)
- [Quick Start](#quick-start)
- [배포 환경](#배포-환경)
- [팀원별 구현 기능](#팀원별-구현-기능)
- [개발 컨벤션](#개발-컨벤션)

### 프로젝트 소개

| 항목 | 내용 |
|------|------|
| **프로젝트명** | WeLive (위리브) |
| **주제** | 아파트 입주민 통합 관리 플랫폼 |
| **개발 기간** | 2026.03.04 ~ 2026.04.01 (4주) |
| **팀 구성** | 백엔드 3명 |

**WeLive**는 아파트 단지의 입주민, 관리자, 슈퍼관리자가 하나의 플랫폼에서 소통하고 관리할 수 있는 **멀티테넌트 아파트 커뮤니티 서비스**입니다.

- **입주민(USER)**: 공지 확인, 투표 참여, 민원 등록, 실시간 알림 수신
- **관리자(ADMIN)**: 공지/투표/이벤트 관리, 입주민 관리, 민원 처리
- **슈퍼관리자(SUPER_ADMIN)**: 아파트 등록 승인, 관리자 관리, 전체 시스템 운영

<br />

### 팀원 소개

<!-- TODO: 각 팀원의 GitHub username으로 교체 -->

<div align="center">

<table>
  <tr>
    <td align="center" width="200">
      <a href="https://github.com/팀원1">
        <img src="https://github.com/팀원1.png" width="100" height="100" style="border-radius: 50%;" alt="팀원1" />
        <br />
        <b>팀원1</b>
      </a>
      <br />
      <sub>담당 모듈 A</sub>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/팀원2">
        <img src="https://github.com/팀원2.png" width="100" height="100" style="border-radius: 50%;" alt="팀원2" />
        <br />
        <b>팀원2</b>
      </a>
      <br />
      <sub>담당 모듈 B</sub>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/팀원3">
        <img src="https://github.com/팀원3.png" width="100" height="100" style="border-radius: 50%;" alt="팀원3" />
        <br />
        <b>팀원3</b>
      </a>
      <br />
      <sub>담당 모듈 C</sub>
    </td>
  </tr>
</table>

</div>

<br />

### 기술 스택

#### Backend

| 분류 | 기술 |
|------|------|
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white) |
| **Framework** | ![Express](https://img.shields.io/badge/Express_4.19-000000?style=for-the-badge&logo=express&logoColor=white) |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) |
| **ORM** | ![Prisma](https://img.shields.io/badge/Prisma_6.18-2D3748?style=for-the-badge&logo=prisma&logoColor=white) |
| **인증** | ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) ![bcrypt](https://img.shields.io/badge/bcrypt-003A70?style=for-the-badge) |
| **파일 저장** | ![Amazon S3](https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white) |
| **모니터링** | ![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white) |
| **스케줄링** | ![node-cron](https://img.shields.io/badge/node--cron-43853D?style=for-the-badge) |
| **실시간** | ![SSE](https://img.shields.io/badge/Server--Sent_Events-FF6600?style=for-the-badge) |
| **검증** | ![Superstruct](https://img.shields.io/badge/Superstruct-1E90FF?style=for-the-badge) |
| **테스트** | ![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white) ![Supertest](https://img.shields.io/badge/Supertest-009688?style=for-the-badge) |

#### Frontend

| 분류 | 기술 |
|------|------|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) |
| **UI** | ![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black) |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) |
| **상태 관리** | ![Zustand](https://img.shields.io/badge/Zustand-433E38?style=for-the-badge) |
| **HTTP** | ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white) |
| **Form/검증** | ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white) |

#### Infra / DevOps

| 분류 | 기술 |
|------|------|
| **배포** | ![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white) ![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white) |
| **CI/CD** | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white) |
| **로드밸런싱** | ![AWS ALB](https://img.shields.io/badge/AWS_ALB-FF9900?style=for-the-badge&logo=awselasticloadbalancing&logoColor=white) |
| **협업** | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white) |

<br />

### 시스템 아키텍처

<!-- TODO: 아키텍처 다이어그램 이미지 추가 (draw.io나 Excalidraw로 제작 권장) -->
<!-- <img src="./docs/images/architecture.png" alt="System Architecture" width="100%" /> -->

```
                        ┌──────────────┐
                        │   Client     │
                        │  (Next.js)   │
                        └──────┬───────┘
                               │ HTTPS
                        ┌──────▼───────┐
                        │   AWS ALB    │
                        │ (Blue-Green) │
                        └──┬───────┬───┘
                    ┌──────▼──┐ ┌──▼──────┐
                    │  BLUE   │ │  GREEN  │
                    │ EC2 x2  │ │ EC2 x2  │
                    │ :80     │ │ :8080   │
                    └──┬──────┘ └─────┬───┘
                       │              │
                    ┌──▼──────────────▼───┐
                    │    Express API      │
                    │  (Node.js + TS)     │
                    ├─────────────────────┤
                    │ Middleware Chain:    │
                    │ CORS → Auth → Authz │
                    │ → Controller → Svc  │
                    │ → Repository        │
                    └──┬──────────┬───────┘
                       │          │
                ┌──────▼──┐  ┌───▼─────┐
                │PostgreSQL│  │ AWS S3  │
                │ (Prisma) │  │ (Files) │
                └──────────┘  └─────────┘
```

#### 데이터 흐름

```
요청 → Router → Controller → Service → Repository → Prisma → PostgreSQL
                     │             │
                     │             └── 비즈니스 로직 (검증, 변환, 트랜잭션)
                     └── 입력 검증 (Superstruct) + 응답 포맷팅
```

<br />

### ERD

<!-- TODO: ERD 이미지 추가 (ERD Cloud나 dbdiagram.io에서 export) -->
<!-- <img src="./docs/images/erd.png" alt="ERD" width="100%" /> -->

#### 주요 엔티티 관계

```
User ──┬── 1:1 ──── Apartment (관리자)
       ├── 1:N ──── Resident (입주민 등록)
       ├── 1:N ──── Notice / Complaint / Vote (작성)
       ├── 1:N ──── Comment (댓글)
       ├── 1:N ──── VoteRecord (투표 기록)
       └── 1:N ──── Notification (알림 수신)

Apartment ──┬── 1:N ──── ApartmentUnit (동/층/호)
            └── 1:1 ──── ApartmentBoard (게시판 네임스페이스)

ApartmentBoard ──┬── 1:N ──── Notice (공지사항)
                 ├── 1:N ──── Complaint (민원)
                 └── 1:N ──── Vote (투표)

Vote ──┬── 1:N ──── VoteOption (투표 선택지)
       └── 1:N ──── VoteRecord (투표 기록)
```

#### 핵심 Enum

| Enum | 값 | 설명 |
|------|-----|------|
| `Role` | USER, ADMIN, SUPER_ADMIN | 사용자 권한 등급 |
| `JoinStatus` | PENDING, APPROVED, REJECTED, NEED_UPDATE | 가입 승인 상태 |
| `ComplaintStatus` | PENDING, IN_PROGRESS, RESOLVED, REJECTED | 민원 처리 상태 |
| `VoteStatus` | SCHEDULED, IN_PROGRESS, CLOSED | 투표 진행 상태 |
| `NoticeCategory` | GENERAL, ANNOUNCEMENT, MAINTENANCE, COMMUNITY, EMERGENCY, ... | 공지 분류 |

<br />

### 주요 기능

#### 인증 / 인가

| 기능 | 설명 |
|------|------|
| 회원가입 | 일반 사용자, 관리자(+아파트 등록), 슈퍼관리자 구분 가입 |
| 로그인/로그아웃 | JWT Access + Refresh Token, HTTP-Only 쿠키 기반 |
| 토큰 갱신 | Refresh Token 회전(Rotation)으로 보안 강화 |
| 역할 기반 인가 | USER / ADMIN / SUPER_ADMIN 3단계 권한 분리 |
| 가입 승인 워크플로우 | PENDING → APPROVED / REJECTED → NEED_UPDATE 상태 관리 |

#### 아파트 / 입주민 관리

| 기능 | 설명 |
|------|------|
| 아파트 구조 등록 | 동/층/호 구조 자동 생성 (Admin 가입 시) |
| 입주민 CRUD | 세대주/세대원 구분, 거주 상태 관리 |
| CSV 일괄 등록 | CSV 파일 업로드로 입주민 대량 등록 |
| CSV 다운로드 | 입주민 명부 CSV 내보내기 |
| 유저-입주민 연동 | 가입한 사용자를 입주민으로 연결 |

#### 공지사항

| 기능 | 설명 |
|------|------|
| 공지 CRUD | 카테고리별 공지 작성/조회/수정/삭제 |
| 카테고리 분류 | 일반, 공지, 유지보수, 커뮤니티, 긴급 등 |
| 조회수 추적 | 공지 열람 시 조회수 자동 증가 |
| 상단 고정 | 중요 공지 핀 고정 기능 |
| 파일 첨부 | S3 기반 이미지/파일 첨부 |

#### 투표

| 기능 | 설명 |
|------|------|
| 투표 CRUD | 투표 생성/조회/수정/삭제 (관리자) |
| 투표 참여/취소 | 선택지별 투표 + 중복 투표 방지 |
| 자동 상태 전환 | Cron Job으로 SCHEDULED → IN_PROGRESS → CLOSED 자동 변경 |
| 투표 결과 | 실시간 투표 현황 및 결과 조회 |

#### 민원

| 기능 | 설명 |
|------|------|
| 민원 등록 | 공개/비공개 민원 작성 |
| 상태 관리 | PENDING → IN_PROGRESS → RESOLVED / REJECTED 워크플로우 |
| 관리자 처리 | 관리자가 민원 상태 변경 및 처리 |
| 댓글 소통 | 민원에 대한 댓글을 통해 입주민-관리자 소통 |

#### 캘린더 이벤트

| 기능 | 설명 |
|------|------|
| 이벤트 관리 | 공지/투표와 연동된 캘린더 이벤트 |
| 월별 조회 | 연/월 기준 이벤트 목록 조회 |
| 자동 연동 | 공지·투표 등록 시 캘린더에 자동 반영 |

#### 실시간 알림

| 기능 | 설명 |
|------|------|
| SSE (Server-Sent Events) | 실시간 알림 스트리밍 |
| 알림 유형 | 공지 등록, 투표 등록/마감, 민원 상태 변경, 가입 요청 등 |
| 읽음 처리 | 개별 알림 읽음 표시 |

#### 파일 관리

| 기능 | 설명 |
|------|------|
| S3 업로드 | 프로필 이미지, 공지 첨부파일, CSV 파일 |
| 지연 삭제 | 삭제 예약 → Cron Job으로 새벽 3시 일괄 삭제 |

<br />

### API 명세

> 전체 API 목록입니다. 인증이 필요한 엔드포인트는 **Auth** 열에 표시했습니다.

#### 인증 (Auth)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| POST | `/api/auth/signup` | - | - | 일반 사용자 회원가입 |
| POST | `/api/auth/signup/admin` | - | - | 관리자 + 아파트 등록 |
| POST | `/api/auth/signup/super-admin` | O | SUPER_ADMIN | 슈퍼관리자 등록 |
| POST | `/api/auth/login` | - | - | 로그인 |
| POST | `/api/auth/logout` | O | - | 로그아웃 |
| POST | `/api/auth/refresh` | - | - | 토큰 갱신 (쿠키 기반) |
| PATCH | `/api/auth/admins/status` | O | SUPER_ADMIN | 관리자 일괄 승인/거절 |
| PATCH | `/api/auth/admins/:adminId/status` | O | SUPER_ADMIN | 관리자 단건 승인/거절 |
| PATCH | `/api/auth/admins/:adminId` | O | SUPER_ADMIN | 관리자 정보 수정 |
| DELETE | `/api/auth/admins/:adminId` | O | SUPER_ADMIN | 관리자 + 아파트 삭제 |
| PATCH | `/api/auth/residents/:residentId/status` | O | ADMIN | 입주민 단건 승인 |
| PATCH | `/api/auth/residents/status` | O | ADMIN | 입주민 일괄 승인 |
| POST | `/api/auth/cleanup` | O | SUPER_ADMIN, ADMIN | 거절 계정 정리 |

#### 사용자 (Users)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| PATCH | `/api/users/me` | O | - | 프로필 이미지 변경 |
| PATCH | `/api/users/password` | O | - | 비밀번호 변경 |

#### 아파트 (Apartments)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/apartments/public` | - | - | 아파트 목록 (공개) |
| GET | `/api/apartments/public/:id` | - | - | 아파트 상세 (공개) |
| GET | `/api/apartments` | O | Role별 분기 | 아파트 목록 (인증) |
| GET | `/api/apartments/:id` | O | Role별 분기 | 아파트 상세 (인증) |

#### 입주민 (Residents)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/residents` | O | ADMIN, SUPER_ADMIN | 입주민 목록 |
| POST | `/api/residents` | O | ADMIN, SUPER_ADMIN | 입주민 등록 |
| GET | `/api/residents/:residentId` | O | ADMIN, SUPER_ADMIN | 입주민 상세 |
| PATCH | `/api/residents/:residentId` | O | ADMIN, SUPER_ADMIN | 입주민 수정 |
| DELETE | `/api/residents/:residentId` | O | ADMIN, SUPER_ADMIN | 입주민 삭제 |
| POST | `/api/residents/from-file` | O | ADMIN, SUPER_ADMIN | CSV 일괄 등록 |
| POST | `/api/residents/from-users/:userId` | O | ADMIN, SUPER_ADMIN | 유저 연동 등록 |
| GET | `/api/residents/file/template` | O | ADMIN, SUPER_ADMIN | CSV 템플릿 다운로드 |
| GET | `/api/residents/file` | O | ADMIN, SUPER_ADMIN | 입주민 CSV 내보내기 |

#### 공지사항 (Notices)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/notices` | O | - | 공지 목록 |
| POST | `/api/notices` | O | ADMIN, SUPER_ADMIN | 공지 작성 |
| GET | `/api/notices/:noticeId` | O | - | 공지 상세 |
| PATCH | `/api/notices/:noticeId` | O | ADMIN, SUPER_ADMIN | 공지 수정 |
| DELETE | `/api/notices/:noticeId` | O | ADMIN, SUPER_ADMIN | 공지 삭제 |

#### 투표 (Polls)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/polls` | O | - | 투표 목록 |
| POST | `/api/polls` | O | ADMIN, SUPER_ADMIN | 투표 생성 |
| GET | `/api/polls/:pollId` | O | - | 투표 상세 |
| PATCH | `/api/polls/:pollId` | O | ADMIN, SUPER_ADMIN | 투표 수정 |
| DELETE | `/api/polls/:pollId` | O | ADMIN, SUPER_ADMIN | 투표 삭제 |

#### 투표 참여 (Votes)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| POST | `/api/options/:optionId/vote` | O | - | 투표하기 |
| DELETE | `/api/options/:optionId/vote` | O | - | 투표 취소 |

#### 민원 (Complaints)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/complaints` | O | - | 민원 목록 |
| POST | `/api/complaints` | O | - | 민원 등록 |
| GET | `/api/complaints/:complaintId` | O | - | 민원 상세 |
| PATCH | `/api/complaints/:complaintId` | O | 작성자 | 민원 수정 |
| DELETE | `/api/complaints/:complaintId` | O | 작성자 | 민원 삭제 |
| PATCH | `/api/complaints/:complaintId/status` | O | ADMIN, SUPER_ADMIN | 민원 상태 변경 |

#### 댓글 (Comments)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| POST | `/api/comments` | O | - | 댓글 작성 |
| PATCH | `/api/comments/:commentId` | O | 작성자, ADMIN | 댓글 수정 |
| DELETE | `/api/comments/:commentId` | O | 작성자, ADMIN | 댓글 삭제 |

#### 알림 (Notifications)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/notifications/sse` | O | - | 실시간 알림 구독 (SSE) |
| PATCH | `/api/notifications/:notificationId/read` | O | - | 알림 읽음 처리 |

#### 이벤트 (Events)

| Method | Endpoint | Auth | 권한 | 설명 |
|--------|----------|:----:|------|------|
| GET | `/api/event` | O | - | 캘린더 이벤트 조회 |
| PUT | `/api/event` | O | ADMIN, SUPER_ADMIN | 이벤트 생성 |
| DELETE | `/api/event/:eventId` | O | ADMIN, SUPER_ADMIN | 이벤트 삭제 |

<br />

### 프로젝트 구조

```
nb-06-welive-team5/
├── src/                          # 백엔드 소스코드
│   ├── main.ts                   # Express 앱 진입점
│   ├── middlewares/               # 미들웨어
│   │   ├── authenticate.ts       #   JWT 인증
│   │   └── authorize.ts          #   Role 기반 인가
│   ├── libs/                     # 공유 유틸리티
│   │   ├── auth/                 #   JWT 토큰 / 쿠키 관리
│   │   ├── errors/               #   에러 핸들러 + 커스텀 에러 클래스
│   │   ├── constants.ts          #   환경변수 / 상수
│   │   ├── corsSetup.ts          #   CORS 설정
│   │   ├── s3Client.ts           #   AWS S3 클라이언트
│   │   └── storage.ts            #   Multer + S3 스토리지
│   ├── auth/                     # 인증 모듈
│   │   ├── auth.router.ts
│   │   ├── auth.controller.ts
│   │   ├── services/             #   일반/관리자/슈퍼관리자 서비스 분리
│   │   └── auth.repository.ts
│   ├── apartments/               # 아파트 모듈
│   ├── residents/                # 입주민 모듈
│   ├── notices/                  # 공지사항 모듈
│   ├── polls/                    # 투표 모듈
│   ├── pollsvote/                # 투표 참여 모듈
│   ├── pollScheduler/            # 투표 스케줄러 모듈
│   ├── complaints/               # 민원 모듈
│   ├── comments/                 # 댓글 모듈
│   ├── notifications/            # 알림 모듈 (SSE)
│   ├── events/                   # 캘린더 이벤트 모듈
│   ├── users/                    # 사용자 프로필 모듈
│   └── jobs/                     # Cron Job (투표 상태, S3 정리)
│
├── front-end/                    # 프론트엔드 (Next.js)
│   └── src/
│       ├── application/          #   앱 레벨 로직 + 스토어
│       ├── entities/             #   데이터 모델 + 타입
│       ├── features/             #   기능별 컴포넌트
│       ├── pages/                #   페이지 라우트
│       ├── shared/               #   공통 컴포넌트 / 훅 / 유틸
│       └── widgets/              #   재사용 UI 위젯
│
├── prisma/                       # DB 스키마 + 마이그레이션
│   ├── schema.prisma             #   데이터 모델 정의
│   ├── seed.ts                   #   초기 데이터 시딩
│   └── migrations/               #   마이그레이션 히스토리
│
├── test/                         # 테스트 코드
│   ├── *.api.test.ts             #   API 통합 테스트
│   └── *.services.test.ts        #   서비스 단위 테스트
│
├── types/                        # TypeScript 타입 정의
│   └── express.d.ts              #   Express Request 확장 (req.user)
│
├── .github/workflows/            # CI/CD
│   └── deploy.yml                #   Blue-Green 배포 파이프라인
│
├── package.json
├── tsconfig.json
└── .env.example                  # 환경변수 템플릿
```

<br />

### Quick Start

#### 사전 요구사항

- **Node.js** 20 이상
- **PostgreSQL** 16 이상
- **AWS 계정** (S3 버킷 — 파일 업로드용)

#### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone https://github.com/GeonSoon1/nb-06-welive-team5.git
cd nb-06-welive-team5
npm install
```

#### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 아래 값들을 설정합니다:

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/welive

# Server
NODE_ENV=development
PORT=8080

# JWT (임의의 긴 문자열)
JWT_ACCESS_TOKEN_SECRET=your-access-secret-key
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret-key

# AWS S3
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Sentry (선택)
SENTRY_DSN=your-sentry-dsn

# 관리자 연락처
SUPPORT_CONTACT=010-1234-5678
```

#### 3. 데이터베이스 초기화

```bash
# Prisma Client 생성 + 마이그레이션 적용
npx prisma migrate dev

# 초기 데이터 시딩 (Super Admin 계정 등)
npm run db:seed
```

#### 4. 서버 실행

```bash
# 백엔드 (포트 8080)
npm run dev

# 프론트엔드 (포트 3000) — 별도 터미널
cd front-end
npm install
npm run dev
```

#### 5. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8080/api

#### 테스트 실행

```bash
npm run test          # 전체 테스트 + 커버리지
npm run typecheck     # TypeScript 타입 검사
```

<br />

### 배포 환경

#### Blue-Green 무중단 배포

```
GitHub Push (dev)
       │
       ▼
┌─────────────────┐
│  GitHub Actions  │
│  CI Pipeline     │
├─────────────────┤
│ 1. Type Check    │
│ 2. Test + Cover  │
│ 3. Build         │
│ 4. Artifact      │
└────────┬────────┘
         │ (성공 시)
         ▼
┌─────────────────┐     ┌─────────────┐
│  CD Pipeline     │────▶│  AWS SSM    │
├─────────────────┤     │  Send Cmd   │
│ 1. 현재 TG 확인  │     └──────┬──────┘
│ 2. 반대 TG 배포  │            │
│ 3. Health Check  │     ┌──────▼──────┐
│ 4. ALB 트래픽    │     │  EC2 x 4    │
│    스위칭        │     │  (2 BLUE +  │
└─────────────────┘     │   2 GREEN)  │
                        └─────────────┘
```

| 구성 요소 | 설명 |
|-----------|------|
| **ALB** | Application Load Balancer — 트래픽 라우팅 |
| **Target Group A (BLUE)** | EC2 2대, 포트 80 |
| **Target Group B (GREEN)** | EC2 2대, 포트 8080 |
| **PM2** | Node.js 프로세스 매니저 (자동 재시작) |
| **SSM** | AWS Systems Manager — EC2 원격 명령 실행 |

**배포 흐름**: 현재 BLUE 운영 중 → GREEN에 새 버전 배포 → Health Check 통과 → ALB가 GREEN으로 트래픽 전환 → 이전 BLUE는 대기

<br />

### 팀원별 구현 기능

<!--
  TODO: 각 팀원 이름과 담당 기능을 실제로 채워주세요.
  스크린샷이나 GIF를 추가하면 훨씬 좋습니다.

  스크린샷 추가 방법:
  1. docs/images/ 폴더에 이미지 저장
  2. ![기능명](./docs/images/파일명.png) 형식으로 삽입

  GIF 녹화 추천 도구: LICEcap (무료), CleanShot X (Mac)
-->

<!--
  TODO: 팀원별 담당 모듈을 실제에 맞게 채워주세요.
  아래는 예시 구성입니다.
-->

#### 팀원1 — 담당 모듈 A

**담당 모듈**: `모듈1`, `모듈2`

- 구현 내용 1
- 구현 내용 2
- 구현 내용 3

<!-- TODO: 스크린샷 추가 -->
<!-- <img src="./docs/images/팀원1-feature.gif" alt="기능" width="600" /> -->

<br />

#### 팀원2 — 담당 모듈 B

**담당 모듈**: `모듈3`, `모듈4`

- 구현 내용 1
- 구현 내용 2
- 구현 내용 3

<!-- TODO: 스크린샷 추가 -->
<!-- <img src="./docs/images/팀원2-feature.gif" alt="기능" width="600" /> -->

<br />

#### 팀원3 — 담당 모듈 C

**담당 모듈**: `모듈5`, `모듈6`

- 구현 내용 1
- 구현 내용 2
- 구현 내용 3

<!-- TODO: 스크린샷 추가 -->
<!-- <img src="./docs/images/팀원3-feature.gif" alt="기능" width="600" /> -->

<br />

### 개발 컨벤션

#### 브랜치 전략

```
main ──────────────────────────────── 운영 배포
  │
  └── dev ─────────────────────────── 개발 통합
        │
        ├── feature/기능명 ─────────── 기능 개발
        ├── fix/버그명 ─────────────── 버그 수정
        └── refactor/대상 ──────────── 리팩토링
```

#### 커밋 메시지

```
Type: 설명

Type:
  feat     새 기능
  fix      버그 수정
  refactor 리팩토링
  test     테스트
  chore    빌드/설정
  docs     문서
  ci       CI/CD
```

#### 코드 구조 (모듈별)

```
모듈명/
├── 모듈명.router.ts        # 라우트 정의 + 미들웨어 적용
├── 모듈명.controller.ts    # 요청/응답 처리 + 입력 검증
├── 모듈명.services.ts      # 비즈니스 로직 + 트랜잭션
├── 모듈명.repository.ts    # DB 쿼리 (Prisma)
├── 모듈명.struct.ts        # 입력 검증 스키마 (Superstruct)
└── 모듈명.type.ts          # 타입 정의
```

#### PR 리뷰 규칙

- PR 생성 시 최소 1명 리뷰 필수
- 테스트 통과 확인 후 merge
- `dev` → `main` merge는 팀 합의 후 진행

<br />

<div align="center">

**WeLive** &copy; 2026 Team 5. All rights reserved.

</div>
