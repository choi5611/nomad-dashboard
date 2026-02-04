# Nomad Dashboard

**3D 인터랙티브 지구본**, **실시간 커뮤니티 기능**, **모바일 우선 디자인**을 결합한 디지털 노마드 플랫폼입니다. WebGL 렌더링, 실시간 데이터 동기화, 복잡한 상태 관리 등 고급 프론트엔드 엔지니어링 기술을 보여주기 위해 제작되었습니다.

**라이브 데모**: [nomad-dashboard.vercel.app](https://nomad-dashboard.vercel.app)
**저장소**: [github.com/choi5611/nomad-dashboard](https://github.com/choi5611/nomad-dashboard)

---

## 목차

- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [기술적 하이라이트](#기술적-하이라이트)
- [아키텍처](#아키텍처)
- [성능 최적화](#성능-최적화)
- [시작하기](#시작하기)
- [테스팅](#테스팅)
- [향후 개선 사항](#향후-개선-사항)
- [라이센스](#라이센스)

---

## 기술 스택

### 프론트엔드

- **React 19** + **TypeScript** - 타입 안정성을 갖춘 컴포넌트 개발
- **Vite 7** - 빠른 개발 환경 및 최적화된 프로덕션 빌드
- **Zustand** - 경량 전역 상태 관리
- **TanStack Query v5** - 서버 상태 관리 및 캐싱
- **React Router v7** - 클라이언트 사이드 라우팅

### 3D 그래픽스

- **Three.js** - WebGL 렌더링 엔진
- **React Three Fiber** - 선언적 3D 씬 구성
- **@react-three/drei** - 카메라 컨트롤 및 유틸리티

### 실시간 & 백엔드

- **Supabase** - PostgreSQL 데이터베이스, 인증, 실시간 구독
- **Supabase Realtime** - Postgres CDC (Change Data Capture) 활용
- **WebSocket** - 즉각적인 메시지 전달

### UI/UX

- **Tailwind CSS** - 유틸리티 우선 스타일링 + 커스텀 다크 테마
- **Framer Motion** - 부드러운 애니메이션 및 트랜지션
- **Recharts** - 데이터 시각화 위젯

### 개발 도구

- **Vitest** - 유닛 및 통합 테스트
- **Testing Library** - 컴포넌트 테스트
- **ESLint** - React 특화 린트 규칙
- **GitHub Actions** - CI/CD 자동화

---

## 주요 기능

### 3D 인터랙티브 지구본

- WebGL 기반 실시간 지구 시각화 및 도시 핀 표시
- 카메라-핀 간 내적 계산을 통한 오클루전 컬링 (Occlusion Culling)
- 줌 레벨에 따라 도시 우선순위를 다르게 표시하는 동적 LOD (Level of Detail) 시스템
- 방위각 회전과 스마트 포커스 트랜지션을 통한 부드러운 카메라 애니메이션
- Additive Blending을 활용한 활동 기반 핀 글로우 효과

### 실시간 커뮤니티 시스템

- **3가지 채팅 타입**: 도시별 채팅, 1:1 다이렉트 메시지, 그룹/오픈 채팅방
- Supabase Realtime CDC 이벤트를 활용한 실시간 메시지 동기화
- 업데이트를 배치 처리하여 리렌더링을 줄이는 메시지 버퍼링 전략
- 사용자 가시성 기반 지능형 안읽음 배지 시스템
- 오픈 라운지에서 임시 닉네임을 사용한 익명 채팅 지원

### 게임화 & 진행 시스템

- 5단계 티어를 가진 XP 기반 랭킹 시스템 (Newcomer → Grand Nomad)
- 최초 발견자 보너스가 있는 도시 발견 메커니즘
- IP 기반 지오로케이션을 활용한 방문 인증
- 방문한 도시에 대한 디지털 메달 수집
- 실시간 XP 추적이 가능한 리더보드

### 데이터 시각화

- API 연동 실시간 날씨 위젯
- 현지 시간대 표시 시계
- 환율 정보 및 통화 변환
- 최근 사용자 활동을 표시하는 글로벌 활동 티커

### 모바일 우선 디자인

- 767px 브레이크포인트를 가진 반응형 레이아웃
- 모바일 디바이스를 위한 네이티브 스타일 하단 네비게이션 바
- 터치 인터랙션에 최적화된 전체 화면 사이드바
- 콘텐츠 업데이트를 위한 Pull-to-Refresh 구현
- 서비스 워커 등록을 통한 PWA 지원

---

## 기술적 하이라이트

### 1. 고급 실시간 아키텍처

**과제**: 성능을 유지하고 중복 알림을 방지하면서 여러 채팅 타입에 걸쳐 실시간 메시지를 동기화

**해결책**: TanStack Query와 Supabase Realtime을 결합한 하이브리드 캐싱 전략 구현:

- 각 채팅 타입별로 별도의 실시간 버퍼를 두어 교차 오염 방지
- 리렌더링을 줄이기 위한 200ms 배치 간격의 메시지 업데이트
- 도시 채팅은 Set 기반, DM은 Map 기반 ID 추적을 통한 중복 제거
- 멤버십 타임스탬프를 포함한 고유 쿼리 키로 캐시 무효화
- 콘텐츠가 화면에 보이지 않을 때만 증가하는 지능형 안읽음 배지 추적

```typescript
// useRealtimeSync.ts의 핵심 구현
const channel = supabase
  .channel("notifications")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "messages" },
    (payload) => {
      if (currentlyViewingCityId !== payload.new.city_id) {
        incrementUnreadBadge("CITY");
      }
    },
  );
```

### 2. 3D 렌더링 최적화

**과제**: 성능 저하 없이 3D 지구본에 수백 개의 도시 핀을 렌더링

**해결책**: 다층적 최적화 전략:

- **오클루전 컬링**: 카메라 방향과 핀 위치 간 내적 계산으로 뒷면 핀 숨김 처리
- **LOD 시스템**: 줌 아웃 시(>25 units) 주요 도시만 표시하는 우선순위 기반 필터링
- **벡터 캐싱**: useMemo를 활용한 Vector3 인스턴스 사전 할당으로 가비지 컬렉션 방지
- **조건부 렌더링**: activityCount > 0일 때만 활동 글로우 렌더링
- **60fps 목표**: requestAnimationFrame을 사용한 최적화된 렌더 루프

```typescript
// Pin.tsx의 오클루전 컬링
const dotProduct = cameraDirection.dot(pinWorldPosition);
if (dotProduct < -0.2) {
  // 핀이 지구본 뒷면에 있으므로 숨김
  labelRef.current.style.opacity = "0";
}
```

### 3. 상태 관리 아키텍처

**과제**: 3D 캔버스, 사이드바, 채팅 뷰, 모달에 걸친 복잡한 UI 상태 관리

**해결책**: 계산된 셀렉터를 가진 Zustand 스토어 전략적 활용:

- 사이드바, 모달, 네비게이션을 위한 `useStore.ts`의 중앙 집중식 UI 상태
- 불필요한 리렌더링을 방지하기 위한 별도의 `useAuth.ts` 인증 스토어
- 컴포넌트 로직을 줄이는 안읽음 카운트용 계산된 셀렉터
- 에러 핸들링이 포함된 마운트 시 자동 도시 데이터 페칭

### 4. 타입 안전 데이터베이스 액세스

**과제**: TypeScript 인터페이스와 PostgreSQL 스키마 간 타입 안정성 유지

**해결책**: 데이터베이스 구조와 일치하는 포괄적인 TypeScript 인터페이스:

- `Profile`, `City`, `DMMessage`, `ChatRoom` 등에 대한 상세한 타입
- 채팅 타입을 위한 유니언 타입: `'city' | 'dm' | 'group' | 'open'`
- 적절한 타입 추론을 가진 제네릭 쿼리 훅
- 컴파일 타임 안정성을 위한 Supabase 생성 타입

### 5. 보안 구현

**과제**: 사용자 생성 콘텐츠에서 XSS 공격 및 악성 입력 방지

**해결책**: 23개의 테스트 케이스를 가진 포괄적인 새니타이제이션 유틸리티:

- `sanitizeText()`: HTML 태그 및 이벤트 핸들러 제거
- `sanitizeSearchQuery()`: 스크립트 인젝션 방지
- `sanitizePostContent()`: 콘텐츠 길이 제한(5000자) 및 iframe 필터링
- http/https 프로토콜만 허용하는 URL 검증
- 국제 사용자를 위한 영숫자 + 한글 문자 지원

### 6. 캐시 관리를 포함한 무한 스크롤

**과제**: 메모리 문제 없이 수천 개의 메시지를 효율적으로 로딩

**해결책**: 커스텀 캐시 버스팅을 포함한 TanStack Query 무한 페이지네이션:

- DM은 페이지당 30개 메시지, 피드는 페이지당 10개 게시물
- 방 변경 시 캐시 리셋을 강제하는 쿼리 키의 `mountId` 타임스탬프
- 마지막 페이지 자동 감지(items < page size)
- 즉각적인 UI 피드백을 위한 임시 ID를 사용한 낙관적 업데이트

---

## 아키텍처

### 데이터 플로우

```
사용자 액션 → 컴포넌트
     ↓
Zustand 스토어 (UI 상태)
     ↓
TanStack Query (서버 상태)
     ↓
Supabase 클라이언트
     ↓
PostgreSQL + Realtime CDC
     ↓
WebSocket 이벤트
     ↓
실시간 버퍼 (200ms 배치)
     ↓
중복 제거 병합
     ↓
컴포넌트 리렌더링
```

### 데이터베이스 스키마

**핵심 테이블**:

- `profiles`: XP, 사용자명, 아바타, 설정을 포함한 사용자 프로필
- `cities`: 도시 디렉토리 (lat, lng, timezone, currency_code, priority)
- `messages`: 도시별 채팅 메시지
- `direct_messages`: DM 및 그룹 메시지용 통합 테이블
- `chat_rooms`: 멤버십 추적을 포함한 그룹 정의
- `room_members`: 사용자별 커스텀 방 이름을 가진 조인 테이블
- `posts`: city_id, 카테고리, 이미지를 포함한 커뮤니티 게시물
- `likes`, `comments`: 소셜 참여 추적
- `friendships`: 상태(대기중/수락됨)를 가진 친구 관계

**주요 RPC 함수**:

- `increment_xp()`: 보너스 계산을 포함한 원자적 XP 업데이트
- `searchable_posts` 뷰: 게시물 + 댓글을 결합한 전체 텍스트 검색

### 컴포넌트 구조

```
src/
├── components/
│   ├── canvas/          # Three.js 3D 컴포넌트
│   │   ├── Globe.tsx    # 텍스처가 있는 지구 메시
│   │   ├── Pin.tsx      # 인터랙티브 도시 마커
│   │   └── Scene.tsx    # 카메라 및 환경
│   ├── community/       # 소셜 기능 (57개 컴포넌트)
│   ├── dashboard/       # 위젯 및 프로필
│   ├── layout/          # 네비게이션 및 구조
│   └── ui/              # 재사용 가능한 UI 프리미티브
├── hooks/               # 27개 커스텀 훅
│   ├── useRealtimeSync.ts  # CDC 이벤트 핸들링
│   ├── useMessages.ts      # 메시지 관리
│   └── useCityChat.ts      # 도시별 채팅 로직
├── store/               # Zustand 상태 관리
├── utils/               # 새니타이제이션, 수학, 랭킹
└── types/               # TypeScript 인터페이스
```

---

## 성능 최적화

### 구현된 최적화

1. **메시지 버퍼링**: 200ms 배칭으로 높은 활동 시 리렌더링을 ~50/sec에서 ~5/sec로 감소
2. **캐시 버스팅**: `mountId` 전략으로 방 간 오래된 데이터 교차 오염 방지
3. **오클루전 컬링**: 내적 체크로 렌더링되는 핀을 평균 ~50% 감소
4. **LOD 시스템**: 줌 아웃 시 20-30개 핀 표시 vs. 줌 인 시 100개 이상
5. **중복 제거**: Set/Map 기반 ID 추적으로 중복 메시지 렌더링 방지
6. **쿼리 Stale Time**: 1분 캐시로 과도한 리페칭 방지 (API 호출 ~80% 감소)
7. **낙관적 업데이트**: 서버 확인 전 즉각적인 UI 피드백
8. **벡터 캐싱**: 사전 할당된 Three.js 객체로 GC 일시 정지 방지
9. **조건부 글로우**: 필요할 때만 활동 효과 렌더링
10. **무한 페이지네이션**: 요청당 10-30개 항목 로드, 전체 데이터셋은 절대 로드 안 함

### 성능 지표

- **3D 지구본**: 최신 하드웨어에서 일관된 60fps
- **메시지 전달**: 전송부터 표시까지 <100ms (같은 도시 내)
- **초기 로드**: 빠른 연결에서 <2초
- **번들 크기**: Vite 코드 스플리팅으로 최적화

---

## 시작하기

### 사전 요구사항

- Node.js 18+ 및 npm 9+
- 프로젝트 설정이 완료된 Supabase 계정

### 설치

1. 저장소 클론

```bash
git clone https://github.com/choi5611/nomad-dashboard.git
cd nomad-dashboard
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정

루트 디렉토리에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. 개발 서버 실행

```bash
npm run dev
```

5. [http://localhost:5173](http://localhost:5173) 접속

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

### 데이터베이스 설정

1. Supabase 프로젝트 생성
2. SQL 마이그레이션 실행 (사용 가능한 경우 `supabase/` 디렉토리의 스키마)
3. 테이블에서 Realtime 활성화: `messages`, `direct_messages`, `room_members`, `chat_rooms`
4. 보안을 위한 RLS 정책 구성

---

## 테스팅

### 테스트 실행

```bash
npm run test          # watch 모드로 테스트 실행
npm run test:ui       # Vitest UI 열기
npm run test:run      # 한 번 실행
npm run test:coverage # 커버리지 리포트 생성
```

### 테스트 커버리지

- **새니타이제이션**: XSS 방지를 다루는 23개의 테스트 케이스
- **채팅 로직**: 실시간 구독 및 캐시 무효화
- **현재 커버리지**: ~15% (중요한 보안 경로에 집중)

### 테스트 전략

- **유닛 테스트**: 순수 유틸리티 함수 (새니타이제이션, 계산)
- **통합 테스트**: React Query + Supabase 모킹
- **컴포넌트 테스트**: UI 인터랙션을 위한 Testing Library
- **E2E**: 아직 구현 안 됨 (Playwright로 계획 중)

### 기술적 복잡성

- **3D 그래픽스**: 오클루전 컬링 및 LOD를 포함한 고급 WebGL
- **실시간**: 커스텀 버퍼링 전략을 가진 WebSocket CDC 이벤트
- **상태 관리**: 계산된 셀렉터를 가진 멀티 스토어 아키텍처
- **성능**: 60fps 렌더링과 함께 100ms 미만의 메시지 전달
- **타입 안정성**: 포괄적인 TypeScript 커버리지

### 소프트웨어 엔지니어링 실천

- **클린 아키텍처**: 명확한 관심사 분리 (컴포넌트, 훅, 유틸, 스토어)
- **테스팅**: Vitest를 사용한 보안 중심 테스트 커버리지
- **코드 품질**: React 모범 사례를 포함한 ESLint 적용
- **CI/CD**: Vercel + GitHub Actions를 통한 자동화된 배포
- **문서화**: 복잡한 로직에 대한 인라인 주석

### 문제 해결 접근 방식

- 실시간 업데이트의 성능 병목 현상 파악 → 200ms 배칭 구현
- 중복 알림 방지 → 지능형 배지 추적 시스템 생성
- 3D 렌더링 최적화 → 오클루전 컬링 및 LOD 적용
- 보안 보장 → 테스트 커버리지를 포함한 포괄적인 새니타이제이션

### 입증된 기술

- 최신 React 패턴 (훅, 컨텍스트, 에러 바운더리)
- WebGL/Three.js 3D 프로그래밍
- 실시간 시스템 아키텍처
- PostgreSQL 데이터베이스 설계
- TypeScript 고급 타입
- 성능 프로파일링 및 최적화
- 보안 모범 사례

---

## 향후 개선 사항

- Capacitor를 사용한 네이티브 모바일 앱
- Postgres 전체 텍스트 검색을 사용한 향상된 검색
- 비디오/음성 채팅 통합
- 고급 분석 대시보드
- 다국어 지원 (i18n)
- Playwright를 사용한 E2E 테스팅
- Storybook 컴포넌트 라이브러리

---

## 라이센스

이 프로젝트는 포트폴리오 작품이며 상업적 사용에 대한 라이센스가 없습니다.

---

## 연락처

**개발자**: 최민혁
**GitHub**: [@choi5611](https://github.com/choi5611)
**프로젝트 링크**: [https://github.com/choi5611/nomad-dashboard](https://github.com/choi5611/nomad-dashboard)
