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

      let query
      let data, error, count

      if (chat.type === 'dm') {
        const result = await supabase
          .from('direct_messages')
          .select('*, sender:profiles!sender_id(username, avatar_url, country_code)', { count: "exact" })
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: false }) // 최신순
          .range(from, to)

        data = result.data
        error = result.error
        count = result.count
      } else if (chat.type === 'group') {
        const result = await supabase
          .from('group_messages')
          .select('*, sender:profiles(username, avatar_url)', { count: "exact" })
          .eq('room_id', chat.id)
          .order('created_at', { ascending: false }) // 최신순
          .range(from, to)

        data = result.data
        error = result.error
        count = result.count
      } else {
        // 오픈 채팅
        const result = await supabase
          .from('direct_messages')
          .select('*', { count: "exact" })
          .eq('room_id', chat.id)
          .order('created_at', { ascending: false }) // 최신순
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
