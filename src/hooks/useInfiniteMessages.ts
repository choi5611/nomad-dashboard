import { useState } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { ChatInfo } from "@/types/message"

const PAGE_SIZE = 30

export function useInfiniteMessages(chat: ChatInfo, userId: string | undefined) {
  // [강제 리프레시] 컴포넌트 마운트 시마다 새로운 ID 생성 -> 캐시 무시하고 서버 조회
  const [mountId] = useState(() => Date.now())

  // 1. 멤버십 및 방 정보 우선 조회
  const { data: membershipData, isSuccess: isMembershipLoaded } = useQuery({
    queryKey: ['chatMembership', chat.id, userId, mountId], // 여기도 mountId 추가
    queryFn: async () => {
      if (!userId || !chat.id) return null

      // [핵심 수정] DM인 경우 방 정보 상시 조회를 하지 않음 (406 에러 방지)
      if (chat.type === 'dm') {
        return { isCreator: false, joinedAt: new Date(0).toISOString(), memberInfo: null }
      }

      console.group(`[CMS-Debug] Membership Check for Room: ${chat.name} (${chat.id})`);
      // 방 정보(생성자, 공개 여부)와 멤버십 정보 병렬 조회
      const [roomResult, memberResult] = await Promise.all([
        supabase.from('chat_rooms').select('created_by, is_open').eq('id', chat.id).maybeSingle(), // single() 대신 maybeSingle()로 안전하게 조회
        supabase.from('room_members').select('*').eq('room_id', chat.id).eq('user_id', userId).maybeSingle()
      ])

      const isCreator = roomResult.data?.created_by === userId
      const isOpenChat = roomResult.data?.is_open
      const memberInfo = memberResult.data
      
      console.log(' - Room Creator ID:', roomResult.data?.created_by);
      console.log(' - Is Open Chat?:', isOpenChat);
      console.log(' - Current User ID:', userId);
      console.log(' - Is User Creator?:', isCreator);
      console.log(' - Member Joined At:', memberInfo?.created_at);

      let joinedAt = new Date().toISOString()

      // 생성자이거나, 비밀 그룹방(is_open=false)인 경우 히스토리 전체 공개 (동기화 문제 해결을 위한 조치)
      if (isCreator || isOpenChat === false) {
        joinedAt = new Date(0).toISOString() 
        console.log(' - Final Result: History Unlocked (Creator or Private Group).');
      } else if (memberInfo && memberInfo.created_at) {
        const date = new Date(memberInfo.created_at)
        // 1시간 버퍼
        date.setHours(date.getHours() - 1)
        joinedAt = date.toISOString()
        console.log(' - Final Result: MEMBER detected. History filtered by join time.');
      } else {
        console.warn(' - Final Result: NO MEMBERSHIP found. History locked to NULL.');
      }

      console.groupEnd();

      return { isCreator, joinedAt, memberInfo }
    },
    enabled: !!userId && !!chat.id,
    staleTime: 0,
  })

  // 2. 메시지 조회 (멤버십 정보가 로드된 후에만 실행)
  const query = useInfiniteQuery({
    // [긴급 수정] mountId를 추가하여 방에 들어올 때마다 무조건 새로운 쿼리로 인식시킴 (캐시 무효화)
    queryKey: ["messages", chat.type, chat.id, membershipData?.joinedAt, membershipData?.isCreator, mountId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) throw new Error("User not authenticated")

      const from = (pageParam as number) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      
      // 비밀 그룹방 + 멤버인 경우, 캐시가 꼬일 수 있으므로 확실한 과거 시간으로 재설정
      const joinedAt = membershipData?.joinedAt || new Date(0).toISOString()
      
      console.log(`[CMS-Debug] Querying ${chat.name} since ${joinedAt}`);

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
        const queryBuilder = supabase.from('direct_messages').select('*, sender:profiles!sender_id(username, avatar_url)', { count: "exact" })

        const result = await queryBuilder
          .eq('room_id', chat.id)
          .gte('created_at', joinedAt)
          .order('created_at', { ascending: false })
          .range(from, to)

        data = result.data
        error = result.error
        count = result.count
        
        console.log(`[CMS-Debug] Query Result: ${data?.length || 0} messages found in DB.`);
      }

      if (error) {
        console.error("[CMS-Debug] Supabase Error:", error);
        throw error
      }

      return {
        messages: (data || []) as any[],
        nextPage: (data && data.length === PAGE_SIZE) ? (pageParam as number) + 1 : undefined,
        totalCount: count || 0
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId && !!chat.id && (chat.type === 'dm' || isMembershipLoaded),
  })

  return {
    ...query,
    membershipData
  }
}
