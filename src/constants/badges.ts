export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  condition?: string
  color?: string
}

export const BADGES: Record<string, Badge> = {
  FIRST_STEP: { 
    id: 'first_step', 
    name: '첫 걸음', 
    icon: '🌱', 
    description: '노마드 대시보드에서 첫 게시글을 작성했습니다.',
    color: 'text-green-400'
  },
  PIONEER: { 
    id: 'pioneer', 
    name: '개척자', 
    icon: '🚩', 
    description: '새로운 도시에서 처음으로 핀을 꽂았습니다.',
    color: 'text-amber-400'
  },
  CONNECTOR: { 
    id: 'connector', 
    name: '커넥터', 
    icon: '🤝', 
    description: '채팅방을 개설하여 사람들을 모았습니다.',
    color: 'text-cyan-400'
  },
  INFLUENCER: {
    id: 'influencer',
    name: '인플루언서',
    icon: '🌟',
    description: '게시글에 좋아요 50개를 받았습니다.',
    color: 'text-pink-400'
  },
  GLOBE_TROTTER: {
    id: 'globe_trotter',
    name: '지구여행자',
    icon: '🌍',
    description: '3개국 이상을 방문했습니다.',
    color: 'text-blue-400'
  }
}
