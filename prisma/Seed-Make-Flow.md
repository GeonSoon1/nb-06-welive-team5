# 작업 내역: 데이터베이스 시딩(Seeding) 기능 구현

## 1. 개요

개발 및 테스트 환경에서 일관된 초기 데이터를 편리하게 주입하기 위해 데이터베이스 시딩(Seeding) 기능을 구현했습니다.

Prisma의 시딩 기능을 활용하여 프로젝트의 데이터베이스 스키마에 맞는 사용자, 아파트, 게시물 등의 샘플 데이터를 생성합니다.

## 2. 주요 작업 내용

### 2.1. 시드 스크립트 작성 (`prisma/seed.ts`)

- **파일 위치**: `prisma/seed.ts`
- **주요 기능**:
  - `SUPER_ADMIN`, `ADMIN`, `USER` 역할을 가진 다양한 사용자 생성
  - 모든 사용자의 기본 비밀번호는 `password123`으로 설정되며, 프로젝트의 암호화 유틸리티(`src/libs/auth/password.ts`)를 통해 해싱되어 저장됩니다.
  - '웰라이브 아파트'라는 샘플 아파트 단지 및 하위 동/호수 유닛 생성
  - 사용자-거주자-아파트 간의 관계 설정
  - 공지사항, 민원, 주민 투표 및 투표 기록 등 각종 컨텐츠 데이터 생성
  - 스크립트 실행 시 기존 데이터를 모두 삭제하고 새로 생성하여 데이터베이스 상태의 일관성을 유지합니다.

### 2.2. 실행 환경 설정 (`package.json`)

- `prisma.seed` 설정을 추가하여 `ts-node`를 통해 TypeScript 시드 스크립트(`prisma/seed.ts`)를 직접 실행할 수 있도록 구성했습니다.
- `scripts`에 `db:seed` 명령어를 추가하여 `prisma db seed`를 더 쉽게 실행할 수 있도록 단축키를 마련했습니다.

```json
"scripts": {
  "...": "...",
  "db:seed": "prisma db seed"
},
"prisma": {
  "seed": "ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts"
}
```

## 3. 사용 방법

데이터베이스 마이그레이션이 완료된 후, 아래 명령어를 실행하여 데이터베이스에 초기 데이터를 주입할 수 있습니다.

```bash
npm run db:seed
```

이 명령어를 실행하면 `prisma/seed.ts`에 정의된 모든 데이터가 데이터베이스에 생성됩니다.
