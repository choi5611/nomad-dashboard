import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import type { ChatInfo } from '@/types/message'
import { useMessages } from './useMessages'

// 실시간 INSERT 콜백을 잡아서 테스트에서 직접 payload를 넣는다
const h = vi.hoisted(() => ({
  insertHandler: null as null | ((payload: { new: Record<string, unknown> }) => Promise<void>),
}))

vi.mock('@/lib/supabase', () => {
  const channel = {
    on: vi.fn((_type: string, _filter: unknown, cb: typeof h.insertHandler) => {
      h.insertHandler = cb
      return channel
    }),
    subscribe: vi.fn(() => channel),
  }
  return {
    supabase: {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
      from: vi.fn(() => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: { username: 'friend', avatar_url: null } }) }) }),
      })),
    },
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: () => ({ data: undefined }),
}))

vi.mock('./useInfiniteMessages', () => ({
  useInfiniteMessages: () => ({
    data: { pages: [] },
    isLoading: false,
    membershipData: { joinedAt: '1970-01-01T00:00:00.000Z' },
  }),
}))

const me = { id: 'me' } as User
const groupChat: ChatInfo = { type: 'group', id: 'room-1', name: 'Room' }
const dmChat: ChatInfo = { type: 'dm', id: 'friend', name: 'Friend' }

async function receive(row: Record<string, unknown>) {
  await act(async () => {
    await h.insertHandler!({ new: { created_at: new Date().toISOString(), content: 'hi', ...row } })
  })
}

describe('useMessages 실시간 필터', () => {
  beforeEach(() => {
    h.insertHandler = null
  })

  it('그룹방을 보는 중 친구가 보낸 DM은 방 메시지로 보이지 않는다', async () => {
    const { result } = renderHook(() => useMessages(groupChat, me))
    await receive({ id: 'dm-1', sender_id: 'friend', receiver_id: 'me', room_id: null })
    expect(result.current.messages).toHaveLength(0)
  })

  it('그룹방 메시지는 그 방에서만 보인다', async () => {
    const { result } = renderHook(() => useMessages(groupChat, me))
    await receive({ id: 'other-room', sender_id: 'friend', room_id: 'room-2' })
    await receive({ id: 'this-room', sender_id: 'friend', room_id: 'room-1' })
    expect(result.current.messages.map(m => m.id)).toEqual(['this-room'])
  })

  it('DM 화면에는 이 상대와의 DM만 보인다', async () => {
    const { result } = renderHook(() => useMessages(dmChat, me))
    await receive({ id: 'room-msg', sender_id: 'friend', room_id: 'room-1' })
    await receive({ id: 'stranger-dm', sender_id: 'stranger', receiver_id: 'me', room_id: null })
    await receive({ id: 'our-dm', sender_id: 'friend', receiver_id: 'me', room_id: null })
    expect(result.current.messages.map(m => m.id)).toEqual(['our-dm'])
  })
})
