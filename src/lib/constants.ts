/**
 * 애플리케이션 전역 상수
 */

// 오픈 채팅방 UUID
export const OPEN_CHAT_ROOMS = {
  GENERAL: '550e8400-e29b-41d4-a716-446655440000',
  LOUNGE: '550e8400-e29b-41d4-a716-446655440001',
} as const

// 오픈 채팅방 ID 배열
export const OPEN_CHAT_ROOM_IDS = Object.values(OPEN_CHAT_ROOMS)

// 헬퍼 함수: 특정 room_id가 오픈 채팅방인지 확인
export const isOpenChatRoom = (roomId: string): boolean => {
  return (OPEN_CHAT_ROOM_IDS as string[]).includes(roomId)
}

// 페이지네이션 설정
export const PAGINATION = {
  POSTS_PER_PAGE: 10,
  COMMENTS_PER_PAGE: 10,
  MESSAGES_INITIAL_LOAD: 50,
} as const

// 자동 회전 설정
export const AUTO_ROTATE_DELAY = 5000 // 5초

// XP 시스템
export const XP_REWARDS = {
  VISIT_CITY: 50,
  CREATE_POST: 10,
  RECEIVE_LIKE: 2,
} as const

// 사용자 제한
export const USER_LIMITS = {
  USERNAME_CHANGE_COOLDOWN_DAYS: 30,
  MAX_UNREAD_COUNT: 99,
} as const
