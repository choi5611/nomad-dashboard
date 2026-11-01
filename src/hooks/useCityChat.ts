import { useState, useEffect, useRef, useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { CityMessage } from "@/types/city-chat"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profile"

const PAGE_SIZE = 30

async function fetchCityMessages(cityId: string, page: number) {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles(username, avatar_url, country_code)")
    .eq("city_id", cityId)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("Chat fetch error:", error)
    throw error
  }

  return (data || []) as CityMessage[]
}

export function useCityChat(
  cityName: string | undefined,
  user: User | null,
  profile: Profile | null
) {
  const cityId = cityName?.toLowerCase()

  const [onlineCount, setOnlineCount] = useState(1)
  // 실시간/낙관적 메시지 (캐시된 히스토리와 별개로 관리)
  const [realtimeMessages, setRealtimeMessages] = useState<CityMessage[]>([])
  const bufferRef = useRef<CityMessage[]>([])

  // 1. 히스토리 로드 (도시별 캐싱 — 재방문 시 캐시 즉시 표시 후 백그라운드 갱신)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["cityMessages", cityId],
    queryFn: ({ pageParam }) => fetchCityMessages(cityId!, pageParam as number),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!cityId,
    staleTime: 0,
  })

  // 2. 히스토리(내림차순 페이지) + 실시간 버퍼 병합, 중복 제거 후 시간순 정렬
  const messages = useMemo(() => {
    const history = data?.pages.flat() ?? []
    const uniqueMap = new Map<string, CityMessage>()
    for (const m of [...history].reverse()) uniqueMap.set(m.id, m)
    for (const m of realtimeMessages) {
      if (!uniqueMap.has(m.id)) uniqueMap.set(m.id, m)
    }
    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [data, realtimeMessages])

  // 도시 변경 시 이전 도시의 실시간 메시지/버퍼 초기화
  useEffect(() => {
    bufferRef.current = []
    setRealtimeMessages([])
  }, [cityId])

  // 로그인 상태가 바뀌어도 채널을 다시 만들지 않도록 user id는 ref로 읽는다
  // (같은 이름 채널을 바로 다시 만들면 supabase-js가 닫히는 중인 채널을 돌려줘 구독이 조용히 죽음)
  const userIdRef = useRef(user?.id)
  useEffect(() => {
    userIdRef.current = user?.id
  }, [user?.id])

  // 3. 실시간 구독 + 프레즌스
  useEffect(() => {
    if (!cityId) return

    const channel = supabase.channel(`chat:${cityId}`)

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // 서버 필터 미사용: "new york"처럼 공백 포함 city_id는 필터 파싱이 실패해
          // 실시간 수신이 조용히 끊긴다. 전체 수신 후 아래에서 city_id 매칭.
        },
        async (payload) => {
          if (payload.new.city_id !== cityId) return
          if (payload.new.author_id === userIdRef.current) return

          const { data } = await supabase
            .from("profiles")
            .select("username, avatar_url, country_code")
            .eq("id", payload.new.author_id)
            .single()

          const newMessage = { ...payload.new, profiles: data } as CityMessage
          bufferRef.current.push(newMessage)
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const count = Object.keys(newState).length
        setOnlineCount(count)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    // 200ms 배치 flush (렌더 폭주 방지)
    const timer = setInterval(() => {
      if (bufferRef.current.length > 0) {
        const flushed = bufferRef.current
        bufferRef.current = []
        setRealtimeMessages((prev) => {
          const existingIds = new Set(prev.map(m => m.id))
          const uniqueNewMessages = flushed.filter(m => !existingIds.has(m.id))
          if (uniqueNewMessages.length === 0) return prev
          return [...prev, ...uniqueNewMessages]
        })
      }
    }, 200)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [cityId])

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim() || !cityId) return

    const tempId = Math.random().toString(36).substring(7)
    const senderProfile = {
      username: profile?.username || user.email?.split('@')[0] || 'Unknown',
      avatar_url: profile?.avatar_url || '',
      country_code: profile?.country_code || 'KR'
    }
    const optimisticMessage: CityMessage = {
      id: tempId,
      content,
      author_id: user.id,
      city_id: cityId,
      created_at: new Date().toISOString(),
      profiles: senderProfile
    }

    setRealtimeMessages(prev => [...prev, optimisticMessage])

    try {
      const { data: inserted, error } = await supabase
        .from("messages")
        .insert({
          content,
          author_id: user.id,
          city_id: cityId,
        })
        .select()
        .single()
      if (error) throw error

      // 임시 메시지를 실제 DB 행으로 교체 (캐시 갱신 시 중복 방지)
      setRealtimeMessages(prev =>
        prev.map(m => m.id === tempId ? { ...inserted, profiles: senderProfile } as CityMessage : m)
      )
    } catch {
      setRealtimeMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error("전송 실패")
    }
  }

  const handleFetchNextPage = async () => {
    if (!hasNextPage || isFetchingNextPage) return
    await fetchNextPage()
  }

  return {
    messages,
    onlineCount,
    loading: isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: handleFetchNextPage,
    handleSendMessage
  }
}
