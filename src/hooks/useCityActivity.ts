import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useCityActivity() {
  const [activities, setActivities] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchActivities() {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        // 1. Fetch posts in last 24h
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('city_id')
          .gt('created_at', yesterday)

        if (postsError) throw postsError

        // 2. Fetch messages in last 24h
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('city_id')
          .gt('created_at', yesterday)

        if (messagesError) throw messagesError

        const counts: Record<string, number> = {}

        postsData?.forEach(p => {
          if (p.city_id) {
            const id = p.city_id.toLowerCase()
            counts[id] = (counts[id] || 0) + 2 // Posts carry more weight (x2)
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
    
    // Refresh every 10 minutes or on window focus
    const interval = setInterval(fetchActivities, 10 * 60 * 1000)
    window.addEventListener('focus', fetchActivities)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', fetchActivities)
    }
  }, [])

  return activities
}
