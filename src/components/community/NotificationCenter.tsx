import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Heart, MessageCircle, X, Circle, UserPlus, Reply, AtSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface Notification {
  id: string
  created_at: string
  type: 'like' | 'comment' | 'friend_request' | 'reply' | 'mention'
  is_read: boolean
  post_id?: string | null
  comment_id?: string | null
  sender_id: string
  sender_profile: {
    username: string
    avatar_url: string
  }
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const setNavigationTarget = useStore(state => state.setNavigationTarget)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          sender_profile:profiles!notifications_sender_id_fkey(username, avatar_url)
        `)
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Notifications fetch error:", error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    }

    fetchNotifications()

    // 실시간 알림 구독
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          // 발신자 정보 가져오기
          const { data: senderData } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", payload.new.sender_id)
            .single()

          const newNotif = {
            ...payload.new,
            sender_profile: senderData,
          } as Notification

          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          
          // 알림음 효과 (선택 사항)
          // const audio = new Audio('/notification.mp3')
          // audio.play()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (id?: string) => {
    if (!user) return
    
    let query = supabase.from("notifications").update({ is_read: true })

    if (id) {
      query = query.eq("id", id)
    } else {
      query = query.eq("receiver_id", user.id).eq("is_read", false)
    }

    const { error } = await query
    
    if (error) {
      console.error("Failed to mark as read:", error)
      return
    }

    if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  const handleNotifClick = async (n: Notification) => {
    markAsRead(n.id)
    setIsOpen(false)
    
    if (n.post_id) {
      // 1. 포스트의 도시 정보를 가져와서 이동이 필요한지 확인
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          city_id,
          cities (
            display_name,
            lat,
            lng,
            timezone,
            country_code,
            currency_code
          )
        `)
        .eq('id', n.post_id)
        .single()

      if (postData?.cities) {
        const cityData = postData.cities as any
        const city = {
          name: cityData.display_name,
          lat: cityData.lat,
          lng: cityData.lng,
          timezone: cityData.timezone,
          countryCode: cityData.country_code,
          currencyCode: cityData.currency_code
        }

        // 현재 도시와 다르면 도시 변경
        if (useStore.getState().selectedCity?.name !== city.name) {
          useStore.getState().setSelectedCity(city)
        }
      }

      setNavigationTarget({ 
        postId: n.post_id, 
        commentId: n.comment_id || undefined 
      })
    } else if (n.type === 'friend_request') {
      const store = useStore.getState()
      store.setActiveTab('friends')
      store.setNavigationTarget(null) // 기존 포스트 타겟 초기화
      // 친구 요청은 Terminal(ChatSidebar)에 있으므로 커뮤니티 사이드바는 닫고 터미널을 엽니다.
      useStore.setState({ isChatOpen: true, isSidebarOpen: false })
    }
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors group"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-cyan-400 animate-bounce' : 'text-white/60'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification List Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile/easy close */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-sm tracking-widest uppercase text-cyan-400">Tactical Logs</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => markAsRead()}
                    className="text-[10px] text-white/40 hover:text-white uppercase tracking-tighter"
                  >
                    Clear All
                  </button>
                  <button onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4 text-white/40 hover:text-white" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-white/20 italic">No incoming signals detected.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 flex gap-3 relative ${!n.is_read ? 'bg-cyan-500/5' : ''}`}
                    >
                      <div className="relative">
                        <img 
                          src={n.sender_profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender_id}`} 
                          className="w-10 h-10 rounded-full border border-white/10"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-white/10">
                          {n.type === 'like' ? (
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                          ) : n.type === 'comment' ? (
                            <MessageCircle className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                          ) : n.type === 'reply' ? (
                            <Reply className="w-3 h-3 text-emerald-400" />
                          ) : n.type === 'mention' ? (
                            <AtSign className="w-3 h-3 text-amber-400" />
                          ) : (
                            <UserPlus className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 leading-snug">
                          <span className="font-bold text-white">{n.sender_profile?.username || 'Somebody'}</span>
                          <span>님이</span>
                          {n.type === 'like' ? <span> 게시글을 좋아합니다.</span> : 
                           n.type === 'comment' ? <span> 댓글을 남겼습니다.</span> : 
                           n.type === 'reply' ? <span> 내 댓글에 답글을 남겼습니다.</span> : 
                           n.type === 'mention' ? <span> 댓글에서 나를 언급했습니다.</span> : 
                           <span> 친구 요청을 보냈습니다.</span>}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1 font-mono">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ko })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <Circle className="w-2 h-2 text-cyan-500 fill-cyan-500 absolute top-4 right-4" />
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 bg-white/5 text-center text-[10px] text-white/20 font-mono tracking-widest border-t border-white/10">
                END OF SIGNAL LOG
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
