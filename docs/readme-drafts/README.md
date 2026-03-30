<div align="center">

<!-- TODO: 히어로 배너 제작 (Figma/Canva, 1280x640px 권장) -->
<!-- 프로젝트 로고 + "WeLive" 텍스트 + 아파트 일러스트 조합 추천 -->
<img src="./docs/images/banner.png" alt="WeLive - 아파트 통합 관리 플랫폼" width="100%" />

<br />
<br />

**우리 아파트, 하나로 연결되다**

입주민 관리부터 공지, 투표, 민원까지 — 아파트의 모든 것을 한 곳에서.

<br />

[![Deploy](https://img.shields.io/badge/Live_Demo-배포_링크-4CAF50?style=for-the-badge)](https://your-deploy-url.com)
[![Notion](https://img.shields.io/badge/Notion-팀_노션-000000?style=for-the-badge&logo=notion)](https://www.notion.so/5-3141acdd347a8135b9d8e1abecbfdc33?source=copy_link)

<br />

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_EC2-FF9900?style=flat-square&logo=amazonec2&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)

</div>

<br />

### 목차

- [프로젝트 소개](#프로젝트-소개)
- [팀원 소개](#팀원-소개)
- [유저 플로우](#유저-플로우)
- [기능 소개](#기능-소개)
- [기술 스택](#기술-스택)
- [ERD](#erd)
- [실행 방법](#실행-방법)

### 프로젝트 소개

<div align="center">

|      항목      |              내용              |
| :------------: | :----------------------------: |
| **프로젝트명** |        WeLive (위리브)         |
| **개발 기간**  |    2026.03.04 ~ 2026.04.01     |
|  **팀 구성**   |           백엔드 3명           |
|    **주제**    | 아파트 입주민 통합 관리 플랫폼 |

</div>

<br />

> **WeLive**는 아파트 입주민, 관리자, 슈퍼관리자 세 역할이 하나의 플랫폼에서
> 공지 확인, 투표 참여, 민원 관리, 실시간 알림까지 모든 커뮤니티 활동을 할 수 있는 서비스입니다.

<br />

### 팀원 소개

<div align="center">

<table>
  <tr>
    <td align="center" width="220">
      <a href="https://github.com/GeonSoon1">
        <img src="https://github.com/GeonSoon1.png" width="120" height="120" style="border-radius: 50%;" />
        <br /><br />
        <b>박건순</b>
      </a>
      <br />
      <sub>팀장</sub>
      <br /><br />
      <a href="https://github.com/GeonSoon1"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" /></a>
    </td>
    <td align="center" width="220">
      <a href="https://github.com/BlueHamster530">
        <img src="https://github.com/BlueHamster530.png" width="120" height="120" style="border-radius: 50%;" />
        <br /><br />
        <b>유인학</b>
      </a>
      <br />
      <sub>팀원</sub>
      <br /><br />
      <a href="https://github.com/BlueHamster530"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" /></a>
    </td>
    <td align="center" width="220">
      <a href="https://github.com/Sunyoung82">
        <img src="https://github.com/Sunyoung82.png" width="120" height="120" style="border-radius: 50%;" />
        <br /><br />
        <b>김선영</b>
      </a>
      <br />
      <sub>팀원</sub>
      <br /><br />
      <a href="https://github.com/팀원3"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" /></a>
    </td>
  </tr>
  <tr>
    <td align="center"><sub>인증, 사용자, 아파트 관리 및 인프라 구축</sub></td>
    <td align="center"><sub>투표, 공지사항, 알림, 이벤트 관리 및 프론트 연동</sub></td>
    <td align="center"><sub>입주민, 민원, 댓글 관리 및 배포 자동화</sub></td>
  </tr>
</table>

</div>

<br />

### 유저 플로우

<img src="./docs/images/user-flow.png" alt="유저 플로우" width="100%" />

```
[비로그인] ─── 회원가입 ───┬── 일반 사용자 ─── 승인 대기 ─── 승인 ─── [USER]
                          ├── 관리자 ──────── 승인 대기 ─── 승인 ─── [ADMIN]
                          └── 슈퍼관리자 ─────────────────────────── [SUPER_ADMIN]

[USER]         공지 조회, 투표 참여, 민원 등록, 댓글, 알림 수신
[ADMIN]        + 공지/투표/이벤트 관리, 입주민 관리, 민원 처리
[SUPER_ADMIN]  + 아파트 등록 승인, 관리자 관리, 전체 시스템 운영
```

<br />

### 기능 소개

<!--
  ============================================================
  TODO: 각 기능별 스크린샷 또는 GIF를 추가해주세요!

  스크린샷/GIF 촬영 팁:
  - Mac: Cmd+Shift+5 (화면 녹화) → gifski로 GIF 변환
  - Windows: Win+G (Xbox Game Bar) 또는 LICEcap
  - 브라우저 크기를 1280x720으로 고정하면 일관된 사이즈
  - GIF는 10초 이내, 핵심 동작만 간결하게

  이미지 저장 위치: docs/images/ 폴더
  ============================================================
-->

#### 회원가입 / 로그인

> JWT + Refresh Token | HTTP-Only 쿠키 | 역할별 가입 플로우

<!-- <img src="./docs/images/feature-auth.gif" alt="로그인" width="700" /> -->

| 기능            | 설명                                     |
| --------------- | ---------------------------------------- |
| 역할별 회원가입 | USER / ADMIN(+아파트 등록) / SUPER_ADMIN |
| JWT 인증        | Access Token 30분 + Refresh Token 7일    |
| 자동 갱신       | Refresh Token Rotation                   |
| 승인 워크플로우 | 가입 → 승인 대기 → 승인/거절             |

<br />

#### 입주민 관리

> CSV 대량 등록 | 세대주/세대원 구분 | 유저 연동

<!-- <img src="./docs/images/feature-resident.gif" alt="입주민 관리" width="700" /> -->

| 기능         | 설명                            |
| ------------ | ------------------------------- |
| 입주민 CRUD  | 동/호수 기반 등록, 수정, 삭제   |
| CSV 업로드   | 엑셀 → CSV 변환 → 대량 등록     |
| CSV 다운로드 | 입주민 명부 내보내기            |
| 유저 연동    | 가입한 사용자를 입주민으로 매핑 |

<br />

#### 공지사항

> 카테고리 분류 | 상단 고정 | 파일 첨부 | 조회수

<!-- <img src="./docs/images/feature-notice.gif" alt="공지사항" width="700" /> -->

| 기능      | 설명                                 |
| --------- | ------------------------------------ |
| 공지 CRUD | 작성, 조회, 수정, 삭제               |
| 카테고리  | 일반, 공지, 유지보수, 커뮤니티, 긴급 |
| S3 첨부   | 이미지/파일 업로드                   |
| 핀 고정   | 중요 공지 최상단 표시                |

<br />

#### 투표 시스템

> 자동 상태 전환 | 실시간 집계 | 중복 방지

<!-- <img src="./docs/images/feature-poll.gif" alt="투표" width="700" /> -->

| 기능      | 설명                                   |
| --------- | -------------------------------------- |
| 투표 생성 | 선택지 + 기간 설정                     |
| 투표 참여 | 1인 1표, 취소 후 재투표 가능           |
| 자동 전환 | Cron: SCHEDULED → IN_PROGRESS → CLOSED |
| 결과 조회 | 실시간 투표 현황                       |

<br />

#### 민원 관리

> 공개/비공개 | 상태 워크플로우 | 댓글 소통

<!-- <img src="./docs/images/feature-complaint.gif" alt="민원" width="700" /> -->

| 기능        | 설명                             |
| ----------- | -------------------------------- |
| 민원 등록   | 공개/비공개 선택                 |
| 상태 관리   | PENDING → IN_PROGRESS → RESOLVED |
| 관리자 처리 | 상태 변경 + 댓글 답변            |
| 댓글 시스템 | 입주민-관리자 실시간 소통        |

<br />

#### 실시간 알림

> SSE (Server-Sent Events) | 유형별 알림 | 읽음 처리

<!-- <img src="./docs/images/feature-notification.gif" alt="알림" width="700" /> -->

| 기능        | 설명                                |
| ----------- | ----------------------------------- |
| 실시간 수신 | SSE 기반 푸시 알림                  |
| 알림 유형   | 공지, 투표, 민원 상태, 가입 요청 등 |
| 읽음 처리   | 개별 알림 확인 표시                 |

<br />

#### 캘린더 이벤트

> 공지/투표 연동 | 월별 조회

<!-- <img src="./docs/images/feature-calendar.gif" alt="캘린더" width="700" /> -->

| 기능        | 설명                  |
| ----------- | --------------------- |
| 이벤트 등록 | 공지/투표와 자동 연동 |
| 월별 조회   | 연/월 기준 캘린더 뷰  |

<br />

#### 인프라 / 배포

> Blue-Green 무중단 배포 | 4대 EC2 | ALB 트래픽 스위칭

<!-- <img src="./docs/images/infra-architecture.png" alt="인프라" width="700" /> -->

```
  GitHub Actions CI       AWS 배포 환경
 ┌─────────────────┐    ┌─────────────────────────────┐
 │ TypeCheck       │    │         AWS ALB             │
 │ Test + Coverage │───▶│    ┌────────┐ ┌────────┐    │
 │ Build           │    │    │ BLUE   │ │ GREEN  │    │
 │ Artifact Upload │    │    │ EC2 x2 │ │ EC2 x2 │    │
 └─────────────────┘    │    └───┬────┘ └───┬────┘    │
                        │        │          │         │
                        │    ┌───▼──────────▼───┐     │
                        │    │   PostgreSQL     │     │
                        │    │   Amazon S3      │     │
                        │    └──────────────────┘     │
                        └─────────────────────────────┘
```

<br />

### 기술 스택

<div align="center">

#### Backend

|    분류    | 기술                                                                                                                                                                                                                    |
| :--------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  Runtime   | ![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)                                                                                                           |
|  Language  | ![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)                                                                                                   |
| Framework  | ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)                                                                                                                |
|  Database  | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) |
|    Auth    | ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)                                                                                                                  |
|  Storage   | ![S3](https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)                                                                                                                  |
| Monitoring | ![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)                                                                                                                   |
|    Test    | ![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)                                                                                                                         |

#### Frontend

|   분류    | 기술                                                                                                                                                                                                                |
| :-------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | ![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black) |
|  Styling  | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)                                                                                                  |
|   State   | ![Zustand](https://img.shields.io/badge/Zustand-433E38?style=for-the-badge)                                                                                                                                         |

#### Infra

|  분류  | 기술                                                                                                                                                                                                        |
| :----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deploy | ![EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white) ![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)         |
| CI/CD  | ![Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)                                                                                       |
| Collab | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white) |

</div>

<br />

### ERD

<img src="./docs/images/erd.png" alt="ERD" width="100%" />

<br />

### 실행 방법

```bash
# 1. 클론
git clone https://github.com/GeonSoon1/nb-06-welive-team5.git
cd nb-06-welive-team5

# 2. 환경변수 설정
cp .env.example .env
# .env 파일 편집 (DB, JWT, AWS 설정)

# 3. 의존성 설치 + DB 초기화
npm install
npx prisma migrate dev
npm run db:seed

# 4. 서버 실행 (포트 8080)
npm run dev

# 5. 프론트엔드 실행 (포트 3000)
cd front-end && npm install && npm run dev
```

<br />

### 프로젝트 문서

<!-- TODO: ERD Cloud 링크 삽입하기-->

| 문서         | 링크                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| ERD          | [ERD Cloud](https://your-erd-url.com)                                                                                                   |
| 와이어프레임 | [Figma](figma.com/design/vRmUGGVrtSWD7YA4o1QQnf/-공유용--위리브-주민들과-아파트-관리-단체를-위한-상호-관리-플랫폼?t=cSJ0PqHA5kmOXpVF-1) |
| 팀 노션      | [Notion](https://www.notion.so/5-3141acdd347a8135b9d8e1abecbfdc33?source=copy_link)                                                     |
| API 문서     | [Swagger](https://nb-project-welive-be.vercel.app/api#/)                                                                                |

<br />

<div align="center">

**WeLive** &copy; 2026 Team 5

</div>
