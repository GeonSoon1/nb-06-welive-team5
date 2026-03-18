# Notices 테스트 코드 안내

## 1. 사용된 테스트 기법

- **생명주기 훅 활용 (Setup & Teardown Hooks)**: `beforeEach`, `afterAll` 등의 Jest 훅을 사용하여 각 테스트 간의 **상태 격리(State Isolation)**를 보장합니다.

## 2. 유사하거나 다른 기법 비교

- **인라인 모킹 (Inline Mocking)**: 훅을 사용하지 않고 `it()` 블록 내부에서 매번 `jest.clearAllMocks()`나 리셋을 직접 호출하는 방식입니다. 테스트가 많아지면 중복 코드가 증가합니다.

## 3. 이 기법을 도입한 이유

Service 계층의 테스트(공지사항 생성, 조회, 수정, 삭제)가 많아지면 앞선 테스트에서의 모킹 호출 기록(`toHaveBeenCalledTimes`)이나 상태가 다음 테스트에 영향을 미쳐(Test Leak) 원인 모를 실패를 유발할 수 있습니다.
공지사항처럼 CRUD 로직이 단순하면서 반복적인 도메인은
`beforeEach`에서 모킹을 깔끔하게 리셋하고 공통 데이터를 세팅함으로써, 테스트 코드의 중복을 줄이고 신뢰성을 확보하는 것이 유리합니다.
