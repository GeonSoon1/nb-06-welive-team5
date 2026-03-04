# Polls Module Analysis

## 1. 개요 (Overview)

`src/polls` 모듈은 애플리케이션 내의 **투표(Vote)** 기능을 담당합니다. 투표 게시글의 생성, 조회(목록/상세), 수정, 삭제(CRUD) 기능을 제공하며, 유지보수와 확장성을 위해 **Layered Architecture (Controller - Service - Repository)** 패턴을 따르고 있습니다.

## 2. 아키텍처 구조 (Architecture)

데이터 흐름은 다음과 같습니다:
`Client` -> `Router` -> `Controller` -> `Service` -> `Repository` -> `Database (Prisma)`

## 3. 파일별 상세 분석

### 3.1. Data Structures & Validation

**`pollstruct.ts`**

- **역할**: 데이터 유효성 검사(Validation) 및 DTO(Data Transfer Object) 정의.
- **라이브러리**: `superstruct`를 사용하여 런타임 데이터 검증을 수행합니다.
- **주요 정의**:
  - `VoteStatus`: 투표 상태 Enum (`PENDING`, `IN_PROGRESS`, `CLOSED`).
  - `CreatePollStruct`: 투표 생성 시 필수 필드(제목, 내용, 날짜, 옵션 등) 검증.
  - `GetPollListQuery`: 목록 조회 시 쿼리 파라미터(페이지, 검색어, 필터) 검증 및 기본값 설정.
  - `UpdatePollStruct`: 수정 시 부분 업데이트(`partial`)를 지원하며 데이터 검증.

**`pollinterfaces.ts`**

- **역할**: TypeScript 인터페이스 정의.
- **내용**: `PollType` 인터페이스를 통해 투표 객체의 타입을 명시적으로 정의합니다.

### 3.2. Routing & Controller

**`pollrouter.ts`**

- **역할**: HTTP 요청 URL을 해당 컨트롤러 메서드와 매핑합니다.
- **구성**:
  - `POST /`: 투표 생성 (`CreatePolls`)
  - `GET /`: 투표 목록 조회 (`GetAllPollList`)
  - `GET /:pollId`: 투표 상세 조회 (`GetPollInfomation`)
  - `PATCH /:pollId`: 투표 수정 (`UpdatePoll`)
  - `DELETE /:pollId`: 투표 삭제 (`DeletePoll`)
- **특징**: `catchAsync` 유틸리티를 사용하여 비동기 핸들러의 에러를 전역 에러 핸들러로 안전하게 전달합니다.

**`pollcontroller.ts`**

- **역할**: HTTP 요청/응답 처리 및 입력값 1차 검증을 담당합니다.
- **주요 로직**:
  - `superstruct`의 `assert`를 사용하여 `req.body` 데이터의 유효성을 보장합니다.
  - `pollId`가 유효한 UUID v4 형식인지 검사하여 잘못된 요청을 조기에 차단합니다.
  - 비즈니스 로직 처리를 위해 `pollService`를 호출하고, 결과를 JSON 형태로 응답합니다.

### 3.3. Business Logic

**`pollservices.ts`**

- **역할**: 실제 비즈니스 로직을 수행하고 데이터를 가공합니다.
- **주요 메서드**:
  - `createPoll`: 요청 DTO를 Prisma 데이터 모델에 맞게 변환합니다. (현재 `authorId`가 테스트용으로 하드코딩되어 있어 추후 수정 필요).
  - `getPollList`: 페이지네이션(`skip`, `take`)을 계산하고, 검색 조건(`where`)을 동적으로 생성합니다. 반환된 데이터를 클라이언트가 사용하기 편한 구조로 매핑합니다.
  - `getPollById`: ID로 투표를 조회하며, 데이터가 없을 경우 `404 CustomError`를 발생시킵니다.
  - `updatePoll`: 투표 정보를 수정합니다. 투표 옵션(`voteOptions`) 수정 시, 기존 옵션을 모두 삭제(`deleteMany`)하고 새로 생성(`create`)하는 전략을 사용합니다.
  - `deletePoll`: 투표 존재 여부를 확인 후 삭제를 요청합니다.

### 3.4. Data Access

**`pollrepository.ts`**

- **역할**: 데이터베이스에 직접 접근하여 쿼리를 실행합니다 (Prisma Client 사용).
- **주요 메서드**:
  - `createPoll`: `prisma.vote.create`를 사용하여 투표와 투표 옵션을 트랜잭션처럼 한 번에 생성합니다.
  - `findPolls`: `prisma.vote.findMany`와 `count`를 병렬(`Promise.all`)로 실행하여 목록과 전체 개수를 효율적으로 가져옵니다.
  - `findPollById`: `prisma.vote.findUnique`를 사용하며 `include`를 통해 작성자(`author`)와 옵션(`voteOptions`) 정보를 함께 조인하여 가져옵니다.
  - `updatePoll`: `prisma.vote.update`를 수행합니다.
  - `deletePoll`: `prisma.vote.delete`를 수행합니다.

## 4. 코드 품질 및 개선 제안 (Code Review Notes)

### 4.1. 개선이 필요한 부분

1. **하드코딩된 사용자 ID**:
   - `pollservices.ts`의 `createPoll` 메서드에 `authorId: "testuseruuid"`가 하드코딩되어 있습니다.
   - **수정 제안**: 컨트롤러에서 `req.user.userId` (JWT 미들웨어 등을 통해 획득)를 추출하여 서비스 계층으로 전달해야 합니다.

2. **투표 옵션 업데이트 로직**:
   - 현재 `updatePoll`은 옵션 수정 시 `deleteMany` 후 `create`를 수행합니다.
   - **잠재적 문제**: 이미 투표가 진행된 상태에서 옵션을 재생성하면, 기존 투표 결과(누가 어떤 옵션에 투표했는지)와의 연결이 끊어지거나 데이터 무결성 문제가 발생할 수 있습니다.
   - **수정 제안**: 투표가 시작된 후에는 옵션 수정을 제한하거나, ID 기반으로 텍스트만 수정하도록 로직을 고도화해야 합니다.

3. **권한 검사 (Authorization)**:
   - 수정(`UpdatePoll`) 및 삭제(`DeletePoll`) 시 해당 글의 작성자인지 확인하는 로직이 서비스 레이어에 명시적으로 보이지 않습니다.
   - **수정 제안**: `pollService`에서 게시글 조회 후 `poll.authorId`와 요청한 유저의 ID를 비교하는 로직을 추가해야 합니다.

### 4.2. 좋은 점

- **구조화된 유효성 검사**: `superstruct`를 활용하여 요청 데이터의 타입을 엄격하게 관리하고 있습니다.
- **명확한 계층 분리**: 컨트롤러, 서비스, 리포지토리의 역할이 명확하게 분리되어 있어 코드 가독성이 높습니다.
- **에러 처리**: `CustomError`와 `catchAsync`를 통해 일관된 에러 응답 포맷을 유지하고 있습니다.
- **Prisma 활용**: `include`와 `Promise.all` 등을 적절히 사용하여 DB 쿼리 효율성을 고려했습니다.

---

_Created by Gemini Code Assist_
