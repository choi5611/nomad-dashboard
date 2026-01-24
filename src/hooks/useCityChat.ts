import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { CityMessage } from "@/types/city-chat"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profile"

const PAGE_SIZE = 30

export function useCityChat(
  cityName: string | undefined,
  user: User | null,
  profile: Profile | null
) {
  const [messages, setMessages] = useState<CityMessage[]>([])
  const [onlineCount, setOnlineCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const pageRef = useRef(0)
  const bufferRef = useRef<CityMessage[]>([])

  // 초기 메시지 및 이전 페이지 가져오기
  const fetchMessages = useCallback(async (page: number) => {
    if (!cityName) return []
    
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles(username, avatar_url, country_code)")
      .eq("city_id", cityName.toLowerCase())
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Chat fetch error:", error)
      toast.error("메시지를 불러오지 못했습니다.")
      return []
    }

    return data || []
  }, [cityName])

  // 초기 로드
  useEffect(() => {
    if (!cityName) return

    const init = async () => {
      setLoading(true)
      pageRef.current = 0
      const initialData = await fetchMessages(0)
      setMessages([...initialData].reverse())
      setHasNextPage(initialData.length === PAGE_SIZE)
      setLoading(false)
    }

    init()

    // 리얼시간 구독
    const channel = supabase.channel(`chat:${cityName.toLowerCase()}`, {
      config: {
        presence: {
          key: user?.id || 'anonymous-' + Math.random().toString(36).substring(7),
        },
      },
    })

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `city_id=eq.${cityName.toLowerCase()}`
        },
        async (payload) => {
          if (payload.new.author_id === user?.id) return

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

    const timer = setInterval(() => {
      if (bufferRef.current.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map(m => m.id))
          const uniqueNewMessages = bufferRef.current.filter(m => !existingIds.has(m.id))
          if (uniqueNewMessages.length === 0) {
            bufferRef.current = []
            return prev
          }
          const next = [...prev, ...uniqueNewMessages]
          return next
        })
        bufferRef.current = []
      }
    }, 200)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [cityName, user?.id, fetchMessages])

  const fetchNextPage = async () => {
    if (!hasNextPage || isFetchingNextPage || !cityName) return
    
    setIsFetchingNextPage(true)
    const nextPage = pageRef.current + 1
    const nextData = await fetchMessages(nextPage)
    
    if (nextData.length > 0) {
      setMessages(prev => [...[...nextData].reverse(), ...prev])
      pageRef.current = nextPage
    }
    
    setHasNextPage(nextData.length === PAGE_SIZE)
    setIsFetchingNextPage(false)
  }

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim() || !cityName) return

    const tempId = Math.random().toString(36).substring(7)
    const optimisticMessage: CityMessage = {
      id: tempId,
      content,
      author_id: user.id,
      city_id: cityName.toLowerCase(),
      created_at: new Date().toISOString(),
      profiles: {
        username: profile?.username || user.email?.split('@')[0] || 'Unknown',
        avatar_url: profile?.avatar_url || '',
        country_code: profile?.country_code || 'KR'
      }
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      const { error } = await supabase.from("messages").insert({
        content,
        author_id: user.id,
        city_id: cityName.toLowerCase(),
      })
      if (error) throw error
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error("전송 실패")
    }
  }

  return {
    messages,
    onlineCount,
    loading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleSendMessage
  }
}
