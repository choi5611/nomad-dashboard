import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { CityMessage } from "@/types/city-chat"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profile"

export function useCityChat(
  cityName: string | undefined,
  user: User | null,
  profile: Profile | null
) {
  const [messages, setMessages] = useState<CityMessage[]>([])
  const [onlineCount, setOnlineCount] = useState(1)
  const bufferRef = useRef<CityMessage[]>([])

  useEffect(() => {
    if (!cityName) return

    // 1. 초기 메시지 가져오기
    const fetchInitialMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(username, avatar_url, country_code)")
        .eq("city_id", cityName.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Chat fetch error:", error)
        return
      }
      setMessages((data || []).reverse())
    }

    fetchInitialMessages()

    // 2. 리얼시간 구독 (Messages + Presence)
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
      .on('presence', { event: 'join' }, () => {
        // 새로운 접속자
      })
      .on('presence', { event: 'leave' }, () => {
        // 이탈자
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    // 3. UI 업데이트 배칭
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
          return next.slice(-100)
        })
        bufferRef.current = []
      }
    }, 200)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [cityName, user?.id])

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim() || !cityName) return

    const tempId = Math.random().toString(36).substring(7)

    // 낙관적 업데이트
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

    setMessages(prev => [...prev, optimisticMessage].slice(-100))

    try {
      const { error } = await supabase.from("messages").insert({
        content,
        author_id: user.id,
        city_id: cityName.toLowerCase(),
      })

      if (error) throw error
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error("전송 실패")
    }
  }

  return {
    messages,
    onlineCount,
    handleSendMessage
  }
}
