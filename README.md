# 🌍 Nomad OS (Digital Nomad Dashboard)

"전 세계를 무대로 일하는 디지털 노마드를 위한 차세대 인터랙티브 대시보드"

Nomad OS는 **Three.js 기반의 3D 인터랙션**, **실시간 커뮤니티 엔진**, 그리고 **모바일 앱 수준의 사용자 경험(UX)**을 결합한 하이엔드 포트폴리오 프로젝트입니다. 단순한 정보 제공을 넘어 전 세계 노마드들이 실시간으로 연결되고 자신의 여정을 인증하는 '디지털 노마드 전용 OS'를 지향합니다.

---

## � Key Highlights

### 🕹️ Interactive 3D Exploration

- **WebGL Globe**: React Three Fiber를 활용한 고성능 3D 지구본.
- **Occlusion Tracking**: 수학적 벡터 연산을 통한 핀(Pin) 가시성 최적화.
- **Smart Camera**: 도시 선택 시 해당 좌표로의 부드러운 카메라 트랜지션.

### 💬 Hyper-Realtime Community

- **Global Terminal**: 도시별 실시간 채팅 및 시스템 로그 스타일의 UI.
- **Social Engine**: 친구 시스템, 1:1 DM, 그룹 채팅 및 오픈 채팅룸 지원.
- **Presence System**: Supabase Realtime을 활용한 도시별 실시간 접속자 추적.

### 🎖️ Identity & Gamification

- **Visit Verification**: IP 기반 위치 감지를 통한 실제 방문 인증 시스템.
- **Medal Collection**: 3D 애니메이션이 적용된 디지털 방문 메달 수집.
- **XP System**: 커뮤니티 활동에 따른 노마드 등급 및 경험치 포인트.

### 📱 Full-Responsive & Mobile Optimized

- **Native-like UX**: 하단 내비게이션 바 및 전체 화면 사이드바 적용.
- **Performance**: 60fps 보장을 위한 렌더링 최적화 및 레이아웃 리플로우 방지.

---

## 🛠 Tech Stack

### Frontend

- **Core**: React 19, TypeScript, Vite
- **3D**: Three.js, React Three Fiber, @react-three/drei
- **State**: Zustand, TanStack Query (v5)
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS (Premium Dark Theme)

### Backend (BaaS)

- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Social & Password-less)
- **Realtime**: Supabase Realtime (CDC, Presence)
- **Storage**: Supabase Storage (Multi-media handling)

---

## 🎯 Key Features & Roadmap

### Phase 1: The 3D World (Completed)

- [x] R3F 기반 인터랙티브 3D 지구본
- [x] 위치 핀 오클루전 처리를 통한 성능 최적화
- [x] 스마트 카메라 이동 로직

### Phase 2: Live Data Hub (Completed)

- [x] 실시간 날씨, 현지 시간, 환율 정보 위젯
- [x] 데이터 시각화 라이브러리(Recharts) 통합

### Phase 3: Social & Identity (Completed)

- [x] 실시간 채팅 터미널 및 알림 시스템
- [x] [Verified] 시그널 배지 및 프로필 관리
- [x] 방문 인증 메달 및 XP 시스템

### Phase 4: Mobile Optimization (Completed)

- [x] Mobile Bottom Navigation 바 구현
- [x] 전체 화면 모바일 사이드바 및 반응형 UI 전환
- [x] 터치 인터랙션 최적화

### Phase 5: Advanced Features (Progress)

- [ ] 오픈채팅방 생성 및 검색 엔진 고도화
- [ ] Capacitor를 활용한 Native App (Android/iOS) 패키징
- [ ] 오프라인 모드(PWA) 지원

---

## 🎨 Design Philosophy

- **Concept**: Future Interface, Space Command Center
- **Colors**: Deep Space Blue (#020617), Neon Cyan (#22d3ee), Glassmorphism Effects
- **Typography**: Inter (UI) / JetBrains Mono (Data/Terminal)

---

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/choi5611/nomad-dashboard.git
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Environment Variables (.env)**

   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
