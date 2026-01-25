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
        // [DEBUG] 그룹 및 오픈 채팅: 본인이 입장한 시간 가져오기
        // 기본값: "지금 현재" (가입 정보 없으면 과거 메시지 절대 보이지 않음)
        let joinedAt = new Date().toISOString()

        try {
          if (chat.id && chat.id.length > 20) {
            // .select('*')로 변경하여 특정 컬럼 부재로 인한 400 에러 회피 시도
            const { data: memberInfo, error } = await supabase
              .from('room_members')
              .select('*') 
              .eq('room_id', chat.id)
              .eq('user_id', userId)
              .maybeSingle()

            if (error) {
              console.error("[ChatDebug] MemberInfo Fetch Error:", error)
            }

            if (memberInfo && memberInfo.created_at) {
              // 정상적으로 가입 시간을 가져온 경우
              const date = new Date(memberInfo.created_at)
              // 1분의 버퍼: 가입 직전의 시스템 메시지나 알림 등을 놓치지 않기 위함
              date.setMinutes(date.getMinutes() - 1)
              joinedAt = date.toISOString()
              console.log("[ChatDebug] Found joinedAt:", joinedAt, "Room:", chat.name)
            } else {
              console.log("[ChatDebug] No created_at found. Treating as new entry.")
            }
          }
        } catch (err) {
          console.warn("[ChatDebug] Logic Error getting joinedAt:", err)
        }

        console.log(`[ChatDebug] Querying messages for ${chat.type} ${chat.id} since ${joinedAt}`)

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
