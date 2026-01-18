# 🌍 Digital Nomad Dashboard (Nomad OS)

## 📌 Project Overview
"전 세계를 누비는 디지털 노마드를 위한 올인원 대시보드"
이 프로젝트는 **Three.js를 활용한 3D 인터랙션**, **실시간 데이터 시각화**, **복잡한 상태 관리(Kanban)** 능력을 보여주기 위한 포트폴리오용 웹 애플리케이션입니다.

## 🛠 Tech Stack
- **Core**: React, TypeScript, Vite
- **3D & Visualization**: Three.js, React Three Fiber (R3F), Drei
- **Data Visualization**: Recharts (Chart.js 대안)
- **State Management**: Zustand
- **Interaction**: Framer Motion, @dnd-kit (Drag & Drop)
- **Styling**: CSS Modules / Vanilla CSS (Premium Dark Theme)
- **Icons**: Lucide React

## 🎯 Key Features & Roadmap

### Phase 1: The World (3D Map)
- [ ] **Interactive 3D Globe**: 마우스로 회전/확대 가능한 3D 지구본 구현 (R3F 활용)
- [ ] **Location Pinning**: 가고 싶은 도시를 지구본 위에 핀(Marker)으로 표시
- [ ] **Smooth Transitions**: 핀 클릭 시 해당 지역으로 부드럽게 카메라 이동

### Phase 2: Live Data Hub (Dashboard)
- [ ] **Real-time Info**: 선택한 도시의 날씨, 현지 시간, 환율 정보 실시간 표시
- [ ] **Exchange Rate Chart**: Recharts를 활용한 환율 변동 추이 그래프
- [ ] **Glassmorphism UI**: 3D 배경 위에 떠 있는 듯한 반투명 글래스 UI 디자인

### Phase 3: Productivity (Kanban Board)
- [ ] **Nomad Kanban**: "비자 준비", "항공권 예매", "숙소 예약" 등 할 일 관리
- [ ] **Drag & Drop**: dnd-kit을 활용한 부드러운 카드 이동 및 정렬
- [ ] **Local Persistence**: 브라우저 로컬 스토리지에 데이터 자동 저장

## 🎨 Design Philosophy
- **Concept**: Future Interface, Space Command Center
- **Colors**: Deep Space Blue, Neon Cyan, Holographic Gradients
- **Typography**: Inter / JetBrains Mono (for data)

## 🚀 Getting Started
1. `npm install`
2. `npm run dev`