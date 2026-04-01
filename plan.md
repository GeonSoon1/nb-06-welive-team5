# Frontend 404 트러블슈팅 종합 계획 (ALB -> Nginx -> EC2)

## 0) 문제 정의

- **증상**: 도메인 접근 시 프론트엔드 페이지에서 `404 Not Found` 발생
- **기대 경로**:
  - `/api/*` -> Nginx -> `localhost:8080` (Backend Node.js)
  - `/*` -> Nginx -> `localhost:3000` (Frontend Next.js)
- **확정 전제**:
  - 백엔드 `8080` 포트 정상 기동 중
  - ALB Target Group은 `80` 포트로 Nginx에 전달
  - server-a, server-b "같게 실행"했지만 런타임이 다를 수 있음

---

## 0-1) 최신 확인 결과 (CloudFront 정리 이후)

- `/` 404는 **CloudFront가 `/`를 `/index.html`로 변환**하면서 발생했던 것으로 확정.
- `Default Root Object` 제거 + 캐시 무효화 후 **홈페이지는 정상 노출됨**.
- 다만 **회원가입 이동 후 다시 `/`로 돌아오는 증상**이 발생.

### Design Intent
이제 문제는 인프라가 아니라 **프론트 라우팅/인증 가드**로 이동했다. 증상의 원인 계층을 명확히 분리해야 “코드 수정이 실제로 문제를 해결했는지” 검증할 수 있다.

---

## 0-2) 회원가입 되돌아감 원인 (프론트)

### 원인 요약
`/resident/signup` 진입 시 아파트 목록 API 호출이 `401`이면, 공통 axios 인터셉터가 `window.location.href = '/'`로 강제 이동한다.  
동시에 `localStorage.getItem('access_token')` 체크가 있어서, 과거 값이 남아 있으면 회원가입 페이지를 즉시 `/`로 리다이렉트한다.

### 수정 내용 (프론트)
- 공개용 API로 호출 변경:
  - `/apartments` → `/apartments/public`
  - `/apartments/:id` → `/apartments/public/:id`
- `resident/signup`에서 `localStorage` 기반 리다이렉트 제거
- `admin/signup`에서도 동일 로직 제거

수정 파일:
- `front-end/src/entities/apartment/api/apartment.api.ts`
- `front-end/src/pages/resident/signup/index.tsx`
- `front-end/src/pages/admin/signup/index.tsx`

### Design Intent
회원가입은 **비로그인 상태**가 정상이다. 인증 실패로 루트로 강제 이동시키는 인터셉터는 “보안 강화”가 아니라 **UX 파괴**다. 공개용 API를 분리하면 프론트 상태관리와 서버 보안 정책이 충돌하지 않는다.

---

## 0-3) server-b에도 코드 적용해야 하나?

결론: **해야 함**.  
현재 Blue/Green 환경에서 프론트 빌드 버전이 섞여 나오는 징후가 있어(`buildId` 불일치), 한 쪽만 수정하면 “한 번은 되고 한 번은 되돌아오는” 현상이 계속된다.

### Design Intent
Blue/Green의 핵심은 **동형성**이다. 사용자 경험은 로드밸런서 레벨에서 **확률적으로 깨지면** 곧바로 장애로 인식된다.

---

## 1) 🚨 1순위 원인 가설: 프론트엔드 프로세스가 3000번에 떠있지 않다

> ⚠️ **CAUTION: Codex 분석에서 놓친 가장 중요한 부분입니다.**

### 증거: `deploy.yml`이 **백엔드만 배포**하고 있음

```yaml
# deploy.yml 94번 라인 — 배포 시 실행되는 커맨드
PORT=${{ env.TARGET_PORT }} pm2 reload welive-api --update-env
```

이 커맨드가 하는 일:
- `welive-api` (백엔드)만 pm2로 reload
- `npm install --production` → 백엔드 루트의 node_modules만 설치
- `npx prisma generate/migrate` → 백엔드 ORM만 처리
- **프론트엔드 (`front-end/`) 디렉토리에 대한 `npm install`, `npm run build`, `pm2 start`가 전혀 없음**

### 논리적 결론

| 질문 | 답변 |
|------|------|
| Nginx `location /`가 3000으로 proxy_pass를 보내는가? | ✅ 설정상 보냄 |
| 3000번에서 뭔가가 응답하고 있는가? | ❓ **불확실 — 이것이 핵심** |
| 3000에 아무것도 없으면? | Nginx가 `502 Bad Gateway` → `error_page 404 /index.html` → **404로 보임** |
| 3000에 뭔가 있는데 /만 응답 가능하면? | 다른 경로 전부 Next.js 앱 레벨 404 |

### Design Intent
> `deploy.yml`은 "무엇이 운영에 올라가는가"의 **Single Source of Truth**다. 여기에 프론트엔드 빌드/기동이 없다면, EC2에서 수동으로 기동한 것이 PM2 crash/restart 후에 살아있다는 보장이 없다. 이것은 **배포 파이프라인의 구조적 결함**이다.

### 즉시 확인 방법 (server-a, server-b 각각)

```bash
# 1. 3000 포트에 진짜 뭐가 떠있는지 확인
sudo ss -ltnp | grep ':3000'

# 2. PM2에서 프론트엔드 프로세스가 있는지 확인
pm2 list

# 3. 3000번 직접 호출
curl -i http://127.0.0.1:3000/
```

### 판단 기준

| `ss` 결과 | `curl :3000` 결과 | 진단 |
|-----------|-------------------|------|
| 3000 LISTEN 없음 | `Connection refused` | ✅ **프론트 프로세스가 아예 죽어있음** (1순위 원인 확정) |
| 3000 LISTEN 있음 | `200 OK` (HTML 반환) | 프론트 정상 → Nginx 매칭 문제로 이동 (2순위) |
| 3000 LISTEN 있음 | `404` | Next.js 앱 레벨 404 → 빌드 문제 또는 라우트 누락 |
| 3000 LISTEN 있음 | `502`/`500` | 프론트 프로세스가 오류 상태 |

---

## 2) 2순위 원인 가설: Nginx server block 매칭 불일치

### 현재 제공된 Nginx 설정의 문제점

당신이 보여준 설정에서 빠진 핵심 정보:
- `server { }` 블록의 **바깥** 설정 (위쪽)
- `server_name` 값
- `listen` 지시자에 `default_server` 유무
- 다른 server 블록 존재 여부 (`/etc/nginx/sites-enabled/default` 등)

#### 왜 이게 중요한가?

```nginx
# 예: 이런 상황이면 Host: welive.pro가 의도한 블록을 안 탈 수 있음
server {
    listen 80 default_server;  # ← /etc/nginx/sites-enabled/default
    root /var/www/html;
}

server {
    listen 80;
    server_name welive.pro;    # ← 당신이 만든 설정
    location / { proxy_pass http://localhost:3000; }
}
```

ALB가 Host 없이 IP로 요청을 보내면 → `default_server`로 매칭 → 404

### 즉시 확인 방법

```bash
# Nginx 전체 설정 덤프 — 어떤 server 블록들이 있는지 전부 확인
sudo nginx -T

# Host 헤더 넣고 / 안넣고 비교
curl -i http://127.0.0.1/                            # Host 없이
curl -i http://127.0.0.1/ -H "Host: welive.pro"     # Host 있게
```

#### 판단 기준
- 두 curl 결과가 다르면 → **server block 매칭 문제 확정**
- 둘 다 404면 → upstream(3000) 문제

### 추가로 확인해야 할 Nginx 설정 항목

> ⚠️ **IMPORTANT: 현재 Nginx `location /` 블록에 `proxy_set_header` 지시자가 빠져있습니다.**

```nginx
# 현재 설정 (문제 가능)
location / {
    proxy_pass http://localhost:3000;
    # proxy_set_header Host $host;           ← 없음!
    # proxy_set_header X-Real-IP $remote_addr; ← 없음!
}
```

이것들이 없으면:
- Next.js가 받는 Host 헤더가 `localhost:3000`이 됨
- Next.js middleware에서 `req.nextUrl`이 예상과 다르게 동작할 수 있음
- 정적 파일 경로 생성이 깨질 수 있음

---

## 3) 3순위: Nginx `error_page 404` 동작 오해

현재 설정:
```nginx
error_page 404 /index.html;
```

이 지시자는 **Nginx 자체가 생성한 404**만 잡는다. `proxy_pass`로 upstream에서 온 404는 기본적으로 **그대로 클라이언트에 전달**된다.

upstream 404를 Nginx에서 가로채려면:
```nginx
proxy_intercept_errors on;  # ← 이것이 필요
error_page 404 /index.html;
```

> 참고: Next.js SSR을 쓰는 경우 `proxy_intercept_errors`를 켜면 Next.js의 자체 404 페이지도 가로채게 되므로, 일반적으로 **SSR 앱에서는 켜지 않는 것이 맞다**. 문제는 Next.js가 떠있냐/아니냐다.

---

## 4) 4순위: 보안그룹 / NACL 점검

> 참고: 보안그룹 문제는 보통 **timeout**이나 **5xx**를 만들지, 404를 만들지는 않습니다. 하지만 완전성을 위해 점검합니다.

### 체크리스트

| 항목 | 기대값 | 설명 |
|------|--------|------|
| ALB SG — Inbound | `80/443` from `0.0.0.0/0` | 외부 접근 허용 |
| ALB SG — Outbound | All traffic to EC2 SG | EC2로 트래픽 전달 |
| EC2 SG — Inbound | `80` from ALB SG | Nginx가 수신 |
| EC2 SG — Inbound | `3000`, `8080`은 **불필요** | 내부 localhost 통신이므로 SG 무관 |
| NACL — Inbound | ALB 서브넷에서 80 허용 | NACL은 Stateless |
| NACL — Outbound | Ephemeral port (1024-65535) 허용 | 응답 패킷 반환 |

### 확인 방법 (AWS 콘솔 또는 CLI)
```bash
# ALB SG 규칙 확인
aws ec2 describe-security-groups --group-ids <ALB-SG-ID>

# EC2 SG 규칙 확인
aws ec2 describe-security-groups --group-ids <EC2-SG-ID>
```

---

## 5) 5순위: ALB Health Check 설정

ALB 대상그룹의 Health Check 경로가 잘못되면, 인스턴스가 **unhealthy**로 빠져서 트래픽이 아예 안 갈 수 있다.

### 확인 사항

| 항목 | 확인 필요 |
|------|-----------|
| Health Check Path | `/` ? `/api/health` ? |
| Protocol | HTTP |
| Port | `80` (traffic port) |
| Healthy/Unhealthy Threshold | 기본값 확인 |
| 현재 대상그룹 상태 | healthy / unhealthy / draining |

```bash
# 대상그룹 상태 확인
aws elbv2 describe-target-health --target-group-arn <TG-ARN>
```

> ⚠️ **WARNING: Health Check Path가 `/`인데, 3000번 프론트가 죽어있으면 → Nginx가 502 반환 → Health Check 실패 → 인스턴스 unhealthy → 아예 트래픽이 안 감. 이 시나리오라면 ALB가 503을 반환해야 하는데, 설정에 따라 404로 보일 수도 있음.**

---

## 6) Blue/Green 대조 점검 (server-a vs server-b)

두 서버가 "같게" 설정했다고 해도, 다음이 다를 수 있다:

| 차이 포인트 | 확인 커맨드 |
|------------|------------|
| Nginx 설정 | `sudo nginx -T \| sha256sum` |
| PM2 프로세스 목록 | `pm2 list` |
| 포트 리스닝 상태 | `sudo ss -ltnp \| egrep ':80\|:3000\|:8080'` |
| front-end 빌드 존재 여부 | `ls -la ~/nb-06-welive-team5/front-end/.next/` |
| 환경변수 | `pm2 env <process-id>` |

---

## 7) 종합 진단 스크립트

> 🔴 **server-a, server-b 각각에서 아래를 실행해서 결과를 붙여주세요. 이것이 절대 우선순위입니다.**

```bash
echo "========== 1. NGINX CONFIG =========="
sudo nginx -T 2>&1 | head -100

echo "========== 2. PORT LISTENING =========="
sudo ss -ltnp | egrep ':80|:3000|:8080'

echo "========== 3. PM2 PROCESS LIST =========="
pm2 list

echo "========== 4. CURL localhost (no Host) =========="
curl -s -o /dev/null -w "HTTP_CODE: %{http_code}\n" http://127.0.0.1/

echo "========== 5. CURL localhost (Host: welive.pro) =========="
curl -i http://127.0.0.1/ -H "Host: welive.pro" 2>&1 | head -20

echo "========== 6. CURL :3000 directly =========="
curl -i http://127.0.0.1:3000/ 2>&1 | head -20

echo "========== 7. CURL :8080 API =========="
curl -s -o /dev/null -w "HTTP_CODE: %{http_code}\n" http://127.0.0.1:8080/api/

echo "========== 8. FRONTEND BUILD CHECK =========="
ls -la ~/nb-06-welive-team5/front-end/.next/BUILD_ID 2>&1

echo "========== 9. NGINX ERROR LOG (last 10) =========="
sudo tail -10 /var/log/nginx/welive_error.log 2>/dev/null || echo "No error log found"

echo "========== 10. NGINX ACCESS LOG (last 10) =========="
sudo tail -10 /var/log/nginx/welive_access.log 2>/dev/null || echo "No access log found"
```

---

## 8) 수정안 (원인별)

### Case A: 3000번에 프론트 프로세스가 없는 경우 (가장 유력)

```bash
# EC2 서버에서 실행
cd ~/nb-06-welive-team5/front-end
npm install
npm run build
pm2 start npm --name "welive-frontend" -- start
pm2 save
```

그리고 `deploy.yml`에 프론트엔드 배포 단계 추가 필요:

```yaml
command: |
  # Backend
  cd /home/ubuntu/nb-06-welive-team5
  git fetch origin dev
  git checkout ${{ github.sha }}
  npm install --production
  npx prisma generate
  npx prisma migrate deploy
  PORT=${{ env.TARGET_PORT }} pm2 reload welive-api --update-env

  # Frontend (추가 필요)
  cd /home/ubuntu/nb-06-welive-team5/front-end
  npm install
  npm run build
  pm2 reload welive-frontend --update-env || pm2 start npm --name "welive-frontend" -- start
```

### Case B: Nginx server block 매칭 문제인 경우

```nginx
server {
    listen 80 default_server;       # ← default_server 명시
    server_name welive.pro _;       # ← 도메인 + fallback

    # 프록시 공통 헤더 (반드시 필요)
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_buffering off;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/welive_access.log;
    error_log /var/log/nginx/welive_error.log;
}
```

**핵심 변경**:
- `proxy_set_header` 4종 추가
- `error_page 404 /index.html` 제거 (Next.js가 404를 직접 핸들링)
- `default_server` 명시

### Case C: 보안그룹/NACL 문제인 경우

- EC2 SG Inbound에 80 from ALB SG 규칙 확인/추가
- NACL Outbound에 ephemeral port 허용 확인

---

## 9) 지금 단정 불가 — 추가 정보 필요

| 항목 | 왜 필요한가 |
|------|------------|
| server-a/b의 `pm2 list` 출력 | 프론트 프로세스 존재 여부 확인 (1순위) |
| server-a/b의 `ss -ltnp` 출력 | 3000 포트 리스닝 확인 (1순위) |
| server-a/b의 `sudo nginx -T` 출력 | server block 구조 전체 확인 (2순위) |
| server-a/b의 `curl :3000/` 결과 | upstream 응답 확인 |
| ALB 대상그룹 현재 상태 (healthy/unhealthy) | 트래픽 전달 여부 |
| 404 시점의 Nginx error/access 로그 | 에러 원점 파악 |

---

## 10) Codex 분석에 대한 평가

### ✅ Codex가 맞는 부분
- Nginx server block 매칭 가설 — 확인 필요한 것은 맞음
- `proxy_intercept_errors` 없이 `error_page`만으로는 upstream 404를 못 잡음
- 관측 가능성 강화 (로그 포맷) — 좋은 접근

### ❌ Codex가 놓친 부분
1. **`deploy.yml`을 "나중에 보자"고 했지만, 이 파일이 핵심 원인 제공자임**
   - 프론트엔드 빌드/배포가 CI/CD 파이프라인에 아예 없음
   - 이것은 "설정 문제"가 아니라 **배포 아키텍처의 구조적 공백**
2. **`front-end/out/` 디렉토리의 존재 의미를 분석하지 않음**
   - `out/`은 `next export`로 생성된 정적 파일 → SSR이 아닌 정적 방식의 잔재
   - 현재는 `next start` (SSR) 로 실행해야 하는 구조인데, 예전에 정적으로 시도한 흔적이 혼재

### Design Intent
> 트러블슈팅에서 "이건 나중에 봐도 된다"는 판단은 매우 위험하다. 특히 **배포 파이프라인**은 운영 문제의 근본 원인인 경우가 많다. "코드는 맞는데 운영이 다르다"의 핵심 원인은 대부분 CI/CD에 있다.

---

## Next Logical Step

**진단 스크립트 실행 (섹션 7)이 현재 절대 우선순위입니다.**

그 결과를 받으면:
1. 3000 포트 리스닝 여부로 Case A/B/C 중 하나로 확정
2. 확정된 원인에 대해 즉시 수정안 적용
3. 수정 후 `deploy.yml`에 프론트엔드 배포 단계 추가 (재발 방지)

이 순서가 올바른 이유: **지금 404를 고치는 것(MTTR 단축)**이 첫 번째이고, **다시 안 나게 만드는 것(MTBF 향상)**이 두 번째이다. 두 가지를 동시에 하면 변수가 늘어서 원인 특정이 어려워진다.
