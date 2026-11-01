import { useState, useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"

export function useGlobalPresence() {
  const [displayCount, setDisplayCount] = useState(0)
  const realCountRef = useRef(0)
  const isStealth = useAuth((state) => !!state.user && !!state.profile?.is_stealth_mode)
  const isStealthRef = useRef(isStealth)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const joinedRef = useRef(false)

  // 채널은 한 번만 만든다. 로그인/스텔스 변경 때 같은 이름 채널을 다시 만들면
  // supabase-js가 닫히는 중인 채널을 돌려줘 구독이 조용히 죽는다.
  // shortcut: presence key가 연결마다 무작위라 한 사람이 탭 2개를 열면 2명으로 셈
  useEffect(() => {
    const channel = supabase.channel('global-presence')
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const currentCount = Object.keys(channel.presenceState()).length
        realCountRef.current = currentCount

        // 처음 구독했을 때는 즉시 숫자를 보여줌 (이후엔 5분 인터벌이 갱신)
        setDisplayCount(prev => (prev === 0 && currentCount > 0 ? currentCount : prev))
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return
        joinedRef.current = true
        // 스텔스 모드가 아닐 때만 트래킹
        if (!isStealthRef.current) await channel.track({ online_at: new Date().toISOString() })
      })

    // 5분에 한 번씩만 UI 숫자를 갱신 (사용자 요청: 너무 자주 바뀌면 어지러움 방지)
    const interval = setInterval(() => {
      setDisplayCount(realCountRef.current)
    }, 5 * 60 * 1000)

    return () => {
      channelRef.current = null
      joinedRef.current = false
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  // 스텔스 설정이 바뀌면 채널은 그대로 두고 트래킹만 켜고 끈다
  useEffect(() => {
    isStealthRef.current = isStealth
    const channel = channelRef.current
    if (!channel || !joinedRef.current) return
    if (isStealth) channel.untrack()
    else channel.track({ online_at: new Date().toISOString() })
  }, [isStealth])

  return displayCount
}
