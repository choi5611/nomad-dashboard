import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Activity, Sparkles } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import UserProfileModal from "./UserProfileModal"
import { Users, MapPin } from "lucide-react"
import FriendsList from "./FriendsList"
import DirectMessageView from "./DirectMessageView"

interface Message {
  id: string;
  content: string;
  author_id: string;
  city_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
    country_code: string;
  };
}

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return ""
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default function ChatSidebar() {
  const { isChatOpen, closeChat, selectedCity, isSidebarOpen, activeChat, setActiveChat } = useStore()
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [onlineCount, setOnlineCount] = useState(1)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { unreadState, resetUnread, activeTab, setActiveTab } = useStore()
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const bufferRef = useRef<Message[]>([])

  // 초기 메시지 로드 및 구독 (Presence 포함)
  useEffect(() => {
    if (!selectedCity) return

    // 1. 초기 50개 메시지 가져오기
    const fetchInitialMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(username, avatar_url, country_code)")
        .eq("city_id", selectedCity.name.toLowerCase())
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
    const channel = supabase.channel(`chat:${selectedCity.name.toLowerCase()}`, {
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
          filter: `city_id=eq.${selectedCity.name.toLowerCase()}`
        },
        async (payload) => {
          if (payload.new.author_id === user?.id) return

          const { data } = await supabase
            .from("profiles")
            .select("username, avatar_url, country_code")
            .eq("id", payload.new.author_id)
            .single()
            
          const newMessage = { ...payload.new, profiles: data } as Message
          bufferRef.current.push(newMessage)
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const count = Object.keys(newState).length
        setOnlineCount(count)
      })
      .on('presence', { event: 'join' }, () => {
        // 새로운 접속자 발생 시 로직 (필요시 알림 등)
      })
      .on('presence', { event: 'leave' }, () => {
        // 이탈자 발생 시 로직
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
  }, [selectedCity, user?.id])

  // 새 메시지 오면 아래로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const openProfile = (id: string) => {
    setSelectedProfileId(id)
    setIsProfileOpen(true)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !inputValue.trim() || !selectedCity) return

    const content = inputValue.trim()
    const tempId = Math.random().toString(36).substring(7)
    
    // 1. 낙관적 업데이트: 즉시 화면에 추가
    const optimisticMessage: Message = {
      id: tempId,
      content,
      author_id: user.id,
      city_id: selectedCity.name.toLowerCase(),
      created_at: new Date().toISOString(),
      profiles: {
        username: profile?.username || user.email?.split('@')[0] || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        country_code: profile?.country_code || 'KR' // 현재 감지된 국가 코드 사용
      }
    }
    
    setMessages(prev => [...prev, optimisticMessage].slice(-100))
    setInputValue("")

    try {
      // 2. 서버 전송 (ID 교체하지 않음)
      const { error } = await supabase.from("messages").insert({
        content,
        author_id: user.id,
        city_id: selectedCity.name.toLowerCase(),
      })

      if (error) throw error
    } catch (error: any) {
      // 에러 발생 시 낙관적 메시지 제거
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error("전송 실패")
    }
  }

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1,
            right: isSidebarOpen ? 384 : 0 
          }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 200,
            right: { duration: 0.3 } // 위치 이동은 살짝 부드럽게
          }}
          className="fixed top-0 h-full w-[400px] bg-slate-900/90 backdrop-blur-3xl border-l border-white/10 z-[49] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="p-4 border-b border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                        Terminal
                    </h2>
                </div>
                <button onClick={closeChat} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
                <button
                    onClick={() => {
                        setActiveTab('city')
                        setActiveChat(null)
                        resetUnread('city')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all relative ${
                        activeTab === 'city' 
                        ? "bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20" 
                        : "text-white/40 hover:bg-white/5"
                    }`}
                >
                    <MapPin className="w-3.5 h-3.5" />
                    CITY HUB
                    {activeTab !== 'city' && unreadState.city > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900">
                            {unreadState.city > 99 ? '99+' : unreadState.city}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => {
                        setActiveTab('friends')
                        setActiveChat(null)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all relative ${
                        activeTab === 'friends' 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                        : "text-white/40 hover:bg-white/5"
                    }`}
                >
                    <Users className="w-3.5 h-3.5" />
                    FRIENDS
                    {activeTab !== 'friends' && (Object.values(unreadState.dms).reduce((a,b)=>a+b,0) + Object.entries(unreadState.rooms).filter(([id]) => !['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'].includes(id)).reduce((a,b)=>a+b[1],0)) > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900">
                            {(Object.values(unreadState.dms).reduce((a,b)=>a+b,0) + Object.entries(unreadState.rooms).filter(([id]) => !['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'].includes(id)).reduce((a,b)=>a+b[1],0)) > 99 ? '99+' : (Object.values(unreadState.dms).reduce((a,b)=>a+b,0) + Object.entries(unreadState.rooms).filter(([id]) => !['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'].includes(id)).reduce((a,b)=>a+b[1],0))}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => {
                        setActiveTab('open')
                        setActiveChat(null)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all relative ${
                        activeTab === 'open' 
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
                        : "text-white/40 hover:bg-white/5"
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    OPEN
                    {activeTab !== 'open' && Object.entries(unreadState.rooms).filter(([id]) => ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'].includes(id)).reduce((a,b)=>a+b[1],0) > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900">
                            {Object.entries(unreadState.rooms).filter(([id]) => ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'].includes(id)).reduce((a,b)=>a+b[1],0) > 99 ? '99+' : Object.entries(unreadState.rooms).filter(([id]) => ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'].includes(id)).reduce((a,b)=>a+b[1],0)}
                        </span>
                    )}
                </button>
            </div>
            <p className="text-[10px] text-cyan-400/50 font-mono tracking-tighter truncate">
                SECURE CONNECTION TO {selectedCity?.name.toUpperCase()} TERMINAL...
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeChat ? (
                <DirectMessageView 
                    chat={activeChat} 
                    onBack={() => setActiveChat(null)} 
                />
            ) : activeTab === 'city' ? (
                <>
                    <div className="px-4 py-2 border-b border-white/5 bg-white/5">
                         <p className="text-[10px] text-cyan-400 font-mono tracking-tighter uppercase">
                            Secure Link to {selectedCity?.name} Terminal • {onlineCount} Active Nomads
                        </p>
                    </div>
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth"
                    >
                        {messages.map((msg, idx) => (
                            <MessageItem 
                                key={msg.id || idx} 
                                message={msg} 
                                isOwn={msg.author_id === user?.id} 
                                onProfileClick={() => openProfile(msg.author_id)}
                            />
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter message..."
                                autoFocus
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-sm leading-none"
                                disabled={!user}
                            />
                            <button 
                                disabled={!inputValue.trim() || !user}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-20 transition-all"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </>
            ) : activeTab === 'friends' ? (
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                    <FriendsList />
                </div>
            ) : (
                <div className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
                    <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Anonymous Lounges
                    </h3>
                    <div className="space-y-3">
                        <OpenChatRoomItem 
                            name="Global Nomad Lounge" 
                            participants={128}
                            unreadCount={unreadState.rooms['550e8400-e29b-41d4-a716-446655440000']}
                            onClick={() => {
                                setActiveChat({ type: 'open', id: '550e8400-e29b-41d4-a716-446655440000', name: 'Global Nomad Lounge' })
                                resetUnread('room', '550e8400-e29b-41d4-a716-446655440000')
                            }}
                        />
                        <OpenChatRoomItem 
                            name="Digital Nomad Tips" 
                            participants={56}
                            unreadCount={unreadState.rooms['550e8400-e29b-41d4-a716-446655440001']}
                            onClick={() => {
                                setActiveChat({ type: 'open', id: '550e8400-e29b-41d4-a716-446655440001', name: 'Digital Nomad Tips' })
                                resetUnread('room', '550e8400-e29b-41d4-a716-446655440001')
                            }}
                        />
                    </div>
                </div>
            )}
          </div>

          {/* Hologic Grid Decor */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
            <div className="w-full h-full bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>

          {/* Context Modals */}
          {selectedProfileId && (
            <UserProfileModal 
                userId={selectedProfileId}
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MessageItem({ message, isOwn, onProfileClick }: { message: Message, isOwn: boolean, onProfileClick: () => void }) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
        >
            <img 
                src={message.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.author_id}`}
                className="w-8 h-8 rounded-lg border border-white/10 bg-slate-800 cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-all"
                alt="Avatar"
                onClick={onProfileClick}
            />
            <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : ''}`}>
                <div className="flex items-center gap-1.5 mb-1">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] group relative">
                        <span className="drop-shadow-sm">
                            {getFlagEmoji(message.profiles?.country_code || 'KR')}
                        </span>
                        <span className="text-cyan-400/80 font-mono font-bold tracking-tighter uppercase">
                            Signal
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-[8px] text-cyan-300 px-2 py-1 rounded border border-cyan-500/30 whitespace-nowrap z-50">
                            Location Verified via IP-Trace
                        </div>
                    </div>
                    <span 
                        className="text-[10px] font-bold text-white/50 hover:text-white cursor-pointer uppercase tracking-widest pl-1 transition-colors"
                        onClick={onProfileClick}
                    >
                        {message.profiles?.username || 'Unknown'}
                    </span>
                    <span className="text-[8px] text-white/20 font-mono">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className={`p-3 rounded-2xl text-xs font-mono leading-relaxed ${
                    isOwn 
                    ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/30 rounded-tr-none' 
                    : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
                }`}>
                    {message.content}
                </div>
            </div>
        </motion.div>
    )
}

function OpenChatRoomItem({ name, participants, onClick, unreadCount }: { name: string, participants: number, onClick: () => void, unreadCount?: number }) {
    return (
        <button 
            onClick={onClick}
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-amber-500/30 transition-all text-left group relative"
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-amber-400"># {name}</span>
                <span className="text-[10px] text-white/20 font-mono">{participants} Active</span>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">Tap to join anonymously</p>
            {unreadCount !== undefined && unreadCount > 0 && (
                <span className="absolute top-4 right-4 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900 shadow-lg">
                    {unreadCount}
                </span>
            )}
        </button>
    )
}
