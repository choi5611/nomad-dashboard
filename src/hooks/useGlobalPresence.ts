import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"

export function useGlobalPresence() {
  const [displayCount, setDisplayCount] = useState(0)
  const realCountRef = useRef(0)
  const { user, profile } = useAuth()

  useEffect(() => {
    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user?.id || 'anonymous-' + Math.random().toString(36).substring(7),
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const currentCount = Object.keys(newState).length
        realCountRef.current = currentCount
        
        // 처음 구독했을 때는 즉시 숫자를 보여줌
        if (displayCount === 0 && currentCount > 0) {
          setDisplayCount(currentCount)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 스텔스 모드가 아닐 때만 트래킹 (익명이거나 stealth_mode가 false인 경우)
          const isStealth = user && profile?.is_stealth_mode
          if (!isStealth) {
            await channel.track({
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    // 5분에 한 번씩만 UI 숫자를 갱신 (사용자 요청: 너무 자주 바뀌면 어지러움 방지)
    const interval = setInterval(() => {
      if (realCountRef.current !== displayCount) {
        setDisplayCount(realCountRef.current)
      }
    }, 5 * 60 * 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user?.id, displayCount])

  return displayCount
}
