import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"

export function useGlobalPresence() {
  const [globalOnlineCount, setGlobalOnlineCount] = useState(0)
  const { user } = useAuth()

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
        setGlobalOnlineCount(Object.keys(newState).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return globalOnlineCount
}
