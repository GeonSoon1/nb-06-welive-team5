# Events 테스트 코드 안내

## 1. 사용된 테스트 기법

- **모듈 모킹 (Module Mocking)**: `jest.mock('./event.repository')`를 사용하여 데이터베이스(Prisma)에 직접 접근하는 Repository 계층을 가짜(Mock) 객체로 대체했습니다.

## 2. 유사하거나 다른 기법 비교

- **통합 테스트 (Integration Testing, ex: Supertest)**: 모킹 없이 실제 DB(또는 테스트용 인메모리 DB)까지 연결하여 Controller부터 Repository까지 통째로 검증하는 방식입니다. DB I/O가 발생하여 속도가 느립니다.
- **스텁 (Stubbing)**: 특정 함수의 반환값만 하드코딩해서 고정시키는 기법입니다. Mocking이 호출 횟수나 인자까지 추적(`toHaveBeenCalled`)한다면, Stub은 상태 반환에 집중합니다.

## 3. 이 기법을 도입한 이유

Service 계층의 주된 책임은 "비즈니스 로직(예: 날짜 범위 검증, 응답 객체 매핑)"을 수행하는 것입니다.
실제 데이터베이스가 없어도 로직의 참/거짓을 판별할 수 있어야 하므로, 데이터베이스 통신 책임을 가진 Repository를 모킹하여 **순수 단위 테스트(Unit Test)** 환경을 구축했습니다.
이를 통해 테스트 속도를 크게 높이고, 환경(DB 상태)에 의존하지 않는 안정적인 테스트가 가능해집니다.
