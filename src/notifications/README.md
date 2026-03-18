# Notifications 테스트 코드 안내

## 1. 사용된 테스트 기법

- **비동기 통신 모킹 (Asynchronous / Promise Mocking)**: `mockResolvedValue` 와 `mockRejectedValue`를 활용하여 외부 네트워크 통신(FCM, Email 발송 등)이 발생했을 때의 비동기 지연 및 응답을 시뮬레이션합니다.

## 2. 유사하거나 다른 기법 비교

- **Nock 또는 MSW (Mock Service Worker)**: `jest.mock`으로 함수 자체를 덮어씌우는 대신, 실제 HTTP 요청이 나갈 때 네트워크 레이어에서 가로채서 가짜 응답을 주는 방식입니다. (외부 API 연동 테스트에 더 정교함)

## 3. 이 기법을 도입한 이유

알림 전송 기능은 Firebase Cloud Messaging(FCM), 메일 서버(SMTP) 등 "외부 의존성"을 강하게 갖습니다.
테스트를 실행할 때마다 실제 사용자에게 푸시 알림이 가거나, 외부 API의 Rate Limit에 걸리는 상황을 방지해야 합니다.
따라서 외부 클라이언트를 직접 모킹하여, 네트워크 지연이나 장애(Timeout)가 발생했을 때
우리 서버가 뻗지 않고 유연하게 대처(에러 로깅 후 정상 응답 등)하는지 검증하기 위해 이 기법을 적용했습니다.
