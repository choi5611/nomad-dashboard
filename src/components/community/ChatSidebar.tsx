import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Activity } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Message {
  id: string;
  content: string;
  author_id: string;
  city_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export default function ChatSidebar() {
  const { isChatOpen, closeChat, selectedCity, isSidebarOpen } = useStore()
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  // const [sending, setSending] = useState(false) // 제거
  const scrollRef = useRef<HTMLDivElement>(null)
  const bufferRef = useRef<Message[]>([])

  // 초기 메시지 로드 및 구독
  useEffect(() => {
    if (!selectedCity) return

    // 1. 초기 50개 메시지 가져오기
    const fetchInitialMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(username, avatar_url)")
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

    // 2. 리얼시간 구독
    const channel = supabase
      .channel(`chat:${selectedCity.name.toLowerCase()}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `city_id=eq.${selectedCity.name.toLowerCase()}`
        },
        async (payload) => {
          // 내 메시지는 이미 낙관적 업데이트로 추가되었으므로 중복 방지
          if (payload.new.author_id === user?.id) return

          // 작성자 정보 가져오기 (배칭 고려 필요하지만 일단 비동기 처리)
          const { data } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", payload.new.author_id)
            .single()
            
          const newMessage = { ...payload.new, profiles: data } as Message
          bufferRef.current.push(newMessage)
        }
      )
      .subscribe()

    // 3. UI 업데이트 배칭 (200ms 주기로 몰아서 처리)
    const timer = setInterval(() => {
      if (bufferRef.current.length > 0) {
        setMessages((prev) => {
            const next = [...prev, ...bufferRef.current]
            return next.slice(-100) // 최근 100개만 유지 (성능 최적화)
        })
        bufferRef.current = []
      }
    }, 200)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [selectedCity])

  // 새 메시지 오면 아래로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
        avatar_url: profile?.avatar_url || null
      }
    }
    
    setMessages(prev => [...prev, optimisticMessage].slice(-100))
    setInputValue("")
    // setSending(true) -> 화면을 막지 않음

    try {
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
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                        <div className="absolute inset-0 bg-cyan-400/20 blur-sm rounded-full animate-ping" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        Comms Link <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">Active</span>
                    </h2>
                </div>
                <button onClick={closeChat} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <p className="text-[10px] text-cyan-400/50 font-mono tracking-tighter truncate">
                SECURE CONNECTION TO {selectedCity?.name.toUpperCase()} TERMINAL...
            </p>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth"
          >
            {messages.map((msg, idx) => (
                <MessageItem key={msg.id || idx} message={msg} isOwn={msg.author_id === user?.id} />
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
            {!user && (
                <p className="mt-2 text-[10px] text-center text-red-400/60 font-mono italic">
                    [ERR] AUTH_REQUIRED: LOGIN TO ESTABLISH LINK
                </p>
            )}
          </div>

          {/* Hologic Grid Decor */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
            <div className="w-full h-full bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MessageItem({ message, isOwn }: { message: Message, isOwn: boolean }) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
        >
            <img 
                src={message.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.author_id}`}
                className="w-8 h-8 rounded-lg border border-white/10 bg-slate-800"
                alt="Avatar"
            />
            <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
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
