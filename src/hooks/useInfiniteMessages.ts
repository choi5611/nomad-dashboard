import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { ChatInfo } from "@/types/message"

const PAGE_SIZE = 30

export function useInfiniteMessages(chat: ChatInfo, userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["messages", chat.type, chat.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) throw new Error("User not authenticated")

      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let data, error, count

      if (chat.type === 'dm') {
        const result = await supabase
          .from('direct_messages')
          .select('*, sender:profiles!sender_id(username, avatar_url, country_code)', { count: "exact" })
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: false })
          .range(from, to)

        data = result.data
        error = result.error
        count = result.count
      } else {
        // 그룹 및 오픈 채팅: 본인이 입장한 시간 가져오기
        const { data: memberInfo } = await supabase
          .from('room_members')
          .select('created_at')
          .eq('room_id', chat.id)
          .eq('user_id', userId)
          .maybeSingle() // single() 대신 maybeSingle() 사용 (데이터 없어도 에러 안 남)

        // 만약 가입 정보가 아직 없다면 (방금 입장한 경우 등) 1초 전을 기준으로 함
        const joinedAt = memberInfo?.created_at || new Date(Date.now() - 1000).toISOString()

        const query = chat.type === 'group' 
          ? supabase.from('group_messages').select('*, sender:profiles(username, avatar_url)', { count: "exact" })
          : supabase.from('direct_messages').select('*', { count: "exact" })

        const result = await query
          .eq('room_id', chat.id)
          .gte('created_at', joinedAt) // 입장 시간 이후 데이터만!
          .order('created_at', { ascending: false })
          .range(from, to)

        data = result.data
        error = result.error
        count = result.count
      }

      if (error) throw error

      return {
        messages: data || [],
        nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count || 0
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId && !!chat.id,
  })
}
