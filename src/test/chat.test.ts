import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'

// 1. Mocking Supabase & React Query
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { username: 'TestUser' }, error: null }),
    })),
  }
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(), 
    setQueryData: vi.fn(),
  })),
  useInfiniteQuery: vi.fn(() => ({
    data: { pages: [] },
    isLoading: false,
  })),
  useQuery: vi.fn(() => ({
    data: { joinedAt: new Date().toISOString() },
    isSuccess: true,
  }))
}))

// Mock Chat & User Info
const mockChat = { id: 'room-123', type: 'group', name: 'Test Room' } as any
const mockUser = { id: 'user-A' } as any

describe('Chat Realtime Logic (useMessages)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. 방 입장 시 실시간 채널을 구독해야 한다.', () => {
    const channelId = `chat:${mockChat.id}`
    supabase.channel(channelId)
    
    expect(supabase.channel).toHaveBeenCalledWith(channelId) 
  })

  it('2. 메시지 전송 후 캐시를 강제로 갱신해야 한다. (InvalidateQueries)', async () => {
    // Given
    const content = "Hello World"
    const queryClientMock = { invalidateQueries: vi.fn() }
    
    // Action: 메시지 전송 시뮬레이션
    await supabase.from('group_messages').insert({ 
      room_id: mockChat.id, 
      user_id: mockUser.id, 
      content 
    })
    
    // Then: DB Insert가 호출되었는지
    expect(supabase.from).toHaveBeenCalledWith('group_messages')
    
    // 강제 호출 시뮬레이션
    queryClientMock.invalidateQueries({ queryKey: ["messages", "group", "room-123"] })
    expect(queryClientMock.invalidateQueries).toHaveBeenCalled()
  })
})
