import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useCityActivity() {
  const [activities, setActivities] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchActivities() {
      try {
        // 최근 30분간의 활동만 체크
        const recentThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString()

        // 1. Fetch posts in last 30m
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('city_id')
          .gt('created_at', recentThreshold)

        if (postsError) throw postsError

        // 2. Fetch messages in last 30m
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('city_id')
          .gt('created_at', recentThreshold)

        if (messagesError) throw messagesError

        const counts: Record<string, number> = {}

        postsData?.forEach(p => {
          if (p.city_id) {
            const id = p.city_id.toLowerCase()
            counts[id] = (counts[id] || 0) + 3 // 게시글은 더 높은 가중치 (+3)
          }
        })

        messagesData?.forEach(m => {
          if (m.city_id) {
            const id = m.city_id.toLowerCase()
            counts[id] = (counts[id] || 0) + 1
          }
        })

        setActivities(counts)
      } catch (err) {
        console.error("Failed to fetch city activities:", err)
      }
    }

    fetchActivities()
    
    // 1분마다 또는 창 포커스 시 갱신하여 라이브 느낌 강화
    const interval = setInterval(fetchActivities, 1 * 60 * 1000)
    window.addEventListener('focus', fetchActivities)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', fetchActivities)
    }
  }, [])

  return activities
}
