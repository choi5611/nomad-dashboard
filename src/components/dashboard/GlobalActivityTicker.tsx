import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Zap, MessageSquare, MapPin, UserPlus } from "lucide-react"

interface ActivityEvent {
  id: string
  type: "post" | "message" | "join" | "checkin"
  userId: string
  username: string
  cityName?: string
  content?: string
  timestamp: Date
}

export default function GlobalActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(0)

  useEffect(() => {
    let isMounted = true

    // 0. Fetch initial recent posts
    const fetchInitialEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('searchable_posts')
          .select('id, author_id, author_username, city_id, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data && isMounted) {
          const initialEvents: ActivityEvent[] = data.map(post => ({
            id: post.id,
            type: "post",
            userId: post.author_id,
            username: post.author_username || "Someone",
            cityName: post.city_id,
            timestamp: new Date(post.created_at)
          }))
          setEvents(initialEvents)
        }
      } catch (err) {
        console.error("Ticker initial fetch error:", err)
      }
    }
    
    fetchInitialEvents()

    // 1. Listen to new posts
    const postChannel = supabase
      .channel('global-activity-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        try {
          const { data: profile } = await supabase.from('profiles').select('username').eq('id', payload.new.author_id).single()
          if (isMounted) {
            const newEvent: ActivityEvent = {
              id: payload.new.id,
              type: "post",
              userId: payload.new.author_id,
              username: profile?.username || "Someone",
              cityName: payload.new.city_id,
              timestamp: new Date()
            }
            addEvent(newEvent)
          }
        } catch (err) {
          console.error("Ticker realtime post error:", err)
        }
      })
      .subscribe()

    // 2. Listen to new profile joins
    const profileChannel = supabase
      .channel('global-activity-profiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        if (isMounted) {
          const newEvent: ActivityEvent = {
            id: payload.new.id,
            type: "join",
            userId: payload.new.id,
            username: payload.new.username || "New Nomad",
            timestamp: new Date()
          }
          addEvent(newEvent)
        }
      })
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(postChannel)
      supabase.removeChannel(profileChannel)
    }
  }, [])

  const addEvent = (event: ActivityEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 5))
  }

  useEffect(() => {
    if (events.length <= 1) return
    const interval = setInterval(() => {
      setCurrentEventIndex(prev => (prev + 1) % events.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [events.length])

  // Reset index if events change drastically
  useEffect(() => {
    setCurrentEventIndex(0)
  }, [events.length === 0])

  const currentEvent = events[currentEventIndex]

  if (!currentEvent) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEvent.id + currentEventIndex}
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.9 }}
          className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl shadow-cyan-500/20 pointer-events-auto"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            {currentEvent.type === "post" && <Zap className="w-4 h-4 text-cyan-400" />}
            {currentEvent.type === "message" && <MessageSquare className="w-4 h-4 text-cyan-400" />}
            {currentEvent.type === "join" && <UserPlus className="w-4 h-4 text-cyan-400" />}
            {currentEvent.type === "checkin" && <MapPin className="w-4 h-4 text-cyan-400" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/70 font-medium truncate">
               <span className="text-cyan-400 font-bold">@{currentEvent.username}</span>
               {currentEvent.type === "post" && `님이 ${currentEvent.cityName}에 글을 남겼습니다.`}
               {currentEvent.type === "join" && `님이 노마드 대시보드에 합류했습니다!`}
               {currentEvent.type === "checkin" && `님이 ${currentEvent.cityName}에 도착했습니다.`}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                  className="w-1 h-1 rounded-full bg-cyan-500"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
