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
        let joinedAt = new Date(0).toISOString()

        try {
          if (chat.id && chat.id.length > 20) {
            // created_at이 없을 수도 있으므로 *로 시도하거나 더 안전하게 처리
            const { data: memberInfo } = await supabase
              .from('room_members')
              .select('*') 
              .eq('room_id', chat.id)
              .eq('user_id', userId)
              .maybeSingle()

            if (memberInfo && (memberInfo as any).created_at) {
              joinedAt = (memberInfo as any).created_at
            }
          }
        } catch (err) {
          console.warn("Failed to fetch joinedAt:", err)
        }

        // 💡 중요: !user_id 또는 !sender_id 처럼 관계 힌트를 명시해야 400 에러가 안 납니다.
        const query = chat.type === 'group' 
          ? supabase.from('group_messages').select('*, sender:profiles!user_id(username, avatar_url)', { count: "exact" })
          : supabase.from('direct_messages').select('*, sender:profiles!sender_id(username, avatar_url)', { count: "exact" })

        const result = await query
          .eq('room_id', chat.id)
          .gte('created_at', joinedAt)
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
