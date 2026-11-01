# Nomad Dashboard

3D 인터랙티브 지구본 + 실시간 커뮤니티를 결합한 디지털 노마드 플랫폼.
WebGL(Three.js) 지구본 위에 도시 핀을 렌더링하고, Supabase Realtime으로 채팅/피드/알림을 실시간 동기화한다. 모바일 우선 디자인.

라이브: https://nomad-dashboard.vercel.app · 저장소: https://github.com/choi5611/nomad-dashboard

## 기술 스택

- **프레임워크**: React 19 + TypeScript (strict) + Vite 7 (포트 5173)
- **상태 관리**: Zustand (UI/전역 상태) — `src/store/useStore.ts`, `src/store/useAuth.ts`
- **서버 상태**: TanStack Query v5 (캐싱, 무한 스크롤, 캐시 무효화)
- **백엔드**: Supabase (PostgreSQL + Auth + Realtime CDC) — `src/lib/supabase.ts`
- **3D**: Three.js + @react-three/fiber + @react-three/drei
- **스타일링**: Tailwind CSS 3 + shadcn/ui (`components.json`, `src/components/ui/`)
- **애니메이션**: Framer Motion · **토스트**: Sonner · **아이콘**: lucide-react
- **테스트**: Vitest + React Testing Library + jsdom
- **패키지 매니저**: npm
- **경로 별칭**: `@` → `src/` (vite.config.ts, tsconfig)

## 프로젝트 구조

```
src/
├── components/
│   ├── auth/        # 로그인 모달
│   ├── canvas/      # Three.js 3D (Globe, Pin, Scene, math)
│   ├── common/      # ErrorBoundary 등 공용
│   ├── community/   # 채팅/피드/친구/DM/댓글 (가장 큰 영역)
│   ├── dashboard/   # 위젯(날씨/환율/시계), 프로필, 메달/랭크
│   ├── layout/      # MobileNav 등 레이아웃
│   └── ui/          # shadcn/ui 프리미티브 (button, card 등)
├── constants/       # badges 등 상수
├── hooks/           # 커스텀 훅 (useRealtimeSync, useMessages, useCityChat 등)
├── lib/             # supabase 클라이언트, utils(cn)
├── store/           # Zustand 스토어 (useStore, useAuth)
├── test/            # 테스트 setup
├── types/           # 공유 TypeScript 타입 (db, message, profile 등)
└── utils/           # sanitize, rankUtils, cropImage, math 등
supabase/            # DB 마이그레이션/스키마
.github/workflows/   # ping-supabase.yml (Supabase 휴면 방지)
```

## 명령어

```bash
npm run dev           # 개발 서버 (포트 5173)
npm run build         # 프로덕션 빌드 (tsc -b && vite build)
npm run lint          # ESLint
npm run test          # Vitest watch
npm run test:run      # Vitest 단일 실행
npm run test:coverage # 커버리지
npx tsc -b            # 타입 체크만 (빌드 없이)
```

## Git 워크플로우

이 프로젝트는 1인 개발로, PR/리뷰 절차 없이 단일 라인으로 작업한다 (실제 git 기록 기준).

- **작업 브랜치: `dev`** — 여기에 직접 커밋하고 `origin/dev`로 push
- **`main`은 dev를 따라옴** — 안정 시점에 dev로 fast-forward (보통 dev와 같은 위치)
- 커밋 메시지: conventional commits 스타일 (`feat : ...`, `fix : ...`, `chore : ...`, `test : ...`)
- PR을 거치지 않으므로 머지 커밋은 만들지 않는다 (`git pull`도 가능하면 rebase로)

### Claude 작업 범위 (Git)

- **commit / push / PR 생성은 사용자가 직접 수행**한다
- Claude는 `git add`, `git commit`, `git push`, `gh pr create`, `gh pr merge` 등을 **자동 실행하지 않는다**
- 사용자가 명시적으로 "커밋해줘 / 푸시해줘 / PR 올려줘"라고 요청할 때만 실행
- `git status`, `git diff`, `git log`, `gh pr view` 같은 **읽기 전용 명령**은 필요 시 자유롭게 사용 가능

## 개발 환경

- Supabase 프로젝트 필요. `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 (둘 다 클라이언트에 노출됨)
- 별도 백엔드 서버/프록시 없음 — 브라우저가 Supabase에 직접 연결
- Realtime은 다음 테이블에서 활성화: `messages`, `direct_messages`, `room_members`, `chat_rooms`

## 아키텍처 핵심

- **데이터 흐름**: 컴포넌트 → Zustand(UI 상태) / TanStack Query(서버 상태) → Supabase 클라이언트 → PostgreSQL + Realtime CDC → WebSocket 이벤트 → 실시간 버퍼(200ms 배치) → 중복 제거 → 리렌더
- **실시간 동기화**: `useRealtimeSync.ts`가 `supabase.channel().on('postgres_changes', ...)`로 CDC 이벤트 구독. 채팅 타입별 버퍼 분리로 교차 오염 방지
- **안읽음 배지**: 콘텐츠가 화면에 안 보일 때만 증가하는 가시성 기반 추적
- **3D 렌더링 최적화**: 오클루전 컬링(내적), 줌 기반 LOD, Vector3 캐싱(GC 방지)
- **인증**: Supabase Auth (`useAuth.ts` 스토어로 세션 관리)

## 코드 스타일

- Prettier 관례: 싱글 쿼트, trailing comma
- TypeScript strict mode, `any` 최소화 (외부 데이터는 `unknown` + 타입 가드)
- 컴포넌트 PascalCase.tsx / 훅·유틸 camelCase.ts
- `import type`으로 타입 전용 import 명시
- 프로덕션 코드에 `console.log` 남기지 않음 (정리는 사용자가 직접 — 자동 제거 금지)

## Claude 행동 원칙

### 코딩 전 사고

- 가정하지 말 것. 불확실하면 구현 전에 먼저 질문한다
- 트레이드오프가 있으면 숨기지 말고 드러낸다
- 복잡한 작업은 계획(무엇을 할지) + 성공 기준(무엇이 되면 완료인지)을 먼저 제시한다

### 수술적 변경

- 요청받은 것만 건드린다. 지나가다 보인 코드 개선은 하지 않는다
- 내가 만든 실수만 정리한다. 기존 코드 스타일을 임의로 바꾸지 않는다
- 변경 파일 수를 최소화한다

### 단순성 우선

- 요청받은 것 이상의 기능을 추가하지 않는다
- 불필요한 추상화, 에러 처리, 옵션을 만들지 않는다
- 200줄이 50줄로 가능하면 단순한 쪽을 선택한다

### 에러 직접 읽기

- 추측하지 않는다. 실제 에러 메시지와 스택 트레이스를 확인 후 수정한다
- `npx tsc -b` / `npm run build` 결과를 직접 읽고 대응한다

### 이 프로젝트 특화

- **상태 관리**: 전역 UI 상태는 Zustand 스토어(`useStore`/`useAuth`), 서버 데이터는 TanStack Query. 컴포넌트에서 직접 fetch 남발 금지
- **데이터 접근**: `src/lib/supabase.ts`의 `supabase` 클라이언트를 통해서만. 훅(`src/hooks/`)으로 감싸 재사용
- **실시간**: `supabase.channel(...)` 구독은 `useEffect` cleanup에서 `supabase.removeChannel()`로 반드시 정리
- **3D(canvas)**: Three.js 객체는 useMemo로 캐싱, 렌더 루프에서 새 객체 생성 금지. 실시간 성능 우선
- **새니타이즈**: 사용자 생성 콘텐츠는 React 텍스트로만 출력(`dangerouslySetInnerHTML` 금지). 검색어·해시태그는 `src/utils/sanitize.ts` 경유

## 개발 규칙

- CSS 파일 새로 만들지 말고 Tailwind utility class만 사용 (shadcn/ui 토큰 활용)
- 컴포넌트: functional component + hooks만
- 새 UI 프리미티브는 `components/ui/`의 shadcn 패턴(`cn()` 유틸, cva variants) 따르기

## 검증 명령어

- 타입 체크: `npx tsc -b`
- 린트: `npm run lint`
- 테스트: `npm run test:run`
- 빌드 확인: `npm run build`
- 코드 작성 후 위 명령어를 실행해서 에러 없는지 확인할 것

## 에이전트 페르소나

에이전트를 생성할 때 아래 페르소나를 자동으로 적용한다.

- **작업 에이전트**: 10년차 시니어 프론트엔드 엔지니어. React/TypeScript/Zustand/Three.js 전문. 버그 수정, 기능 구현, 리팩토링 등 실제 코드 작업을 수행한다.
- **감독 에이전트**: 20년차 시니어 개발팀장. 작업 에이전트의 결과물을 검증하고, false positive를 걸러내고, 놓친 이슈를 찾고, 잘못된 수정을 직접 고친다. 타입 체크와 빌드 확인까지 수행한다.
- **코드 리뷰 에이전트**: 10년차 코드 리뷰어. PR 전 셀프 리뷰를 수행한다. 버그, 타입 안전성, 컨벤션 위반, 성능 이슈, 보안 취약점을 검토하고 구체적인 개선점을 제안한다.
- **QA 에이전트**: 10년차 QA 엔지니어. 기능별 버그, 엣지 케이스, 경쟁 조건, 메모리 누수, 에러 핸들링 누락 등을 전수 조사한다. 심각도(상/중/하)를 매기고 재현 경로를 명시한다.
- **분석 에이전트**: 코드베이스를 탐색하고 구조를 파악하는 리서치 전문. 코드를 수정하지 않고 분석 결과만 보고한다.

### 명명된 전문 에이전트 ([.claude/agents/](.claude/agents/))

위 5개 페르소나는 일반 작업 톤 가이드이고, 특정 영역은 이름으로 직접 호출 가능한 전문 에이전트를 사용한다.

- **typescript-reviewer**: TS/React 타입 안전성, async 정확성, Zustand/TanStack Query 패턴, Supabase Realtime 구독·정리 컨벤션 전담. 코드 변경 후 셀프 리뷰 시 우선 호출.
- **silent-failure-hunter**: 빈 catch, `.catch(() => [])` 같은 가짜 fallback, 에러 전파 누락, Supabase 응답 `{ data, error }`의 `error` 무시, useEffect cleanup(채널/타이머) 누락 추적 전담. 리팩토링/버그 수정 후 숨은 실패 검증 시 호출.

## 추가 규칙

@.claude/rules/ts-style.md
@.claude/rules/web-style.md
@.claude/rules/web-performance.md
@.claude/rules/code-review.md
