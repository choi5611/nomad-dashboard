import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Send, ChevronLeft, Loader2, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { toast } from "sonner"

import { generateRandomNickname } from "@/utils/nicknameUtils"
import { useStore } from "@/store/useStore"

interface DMMessage {
  id: string
  sender_id: string
  receiver_id?: string
  room_id?: string
  content: string
  is_anonymous?: boolean
  nickname?: string
  created_at: string
}

interface DirectMessageViewProps {
  chat: {
    type: 'dm' | 'group' | 'open'
    id: string
    name: string
    avatar_url?: string
  }
  onBack: () => void
}

export default function DirectMessageView({ chat, onBack }: DirectMessageViewProps) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [anonNickname, setAnonNickname] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // 익명 닉네임 설정
  useEffect(() => {
    if (chat.type === 'open') {
      const saved = localStorage.getItem(`anon_nick_${chat.id}`)
      if (saved) {
        setAnonNickname(saved)
      } else {
        const newNick = generateRandomNickname(profile?.country_code || 'UN')
        setAnonNickname(newNick)
        localStorage.setItem(`anon_nick_${chat.id}`, newNick)
      }
    }
  }, [chat.id, chat.type, profile?.country_code])

  useEffect(() => {
    if (!user) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        let query = supabase.from('direct_messages').select('*')
        
        if (chat.type === 'dm') {
          query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${user.id})`)
        } else {
          query = query.eq('room_id', chat.id)
        }

        const { data, error } = await query.order('created_at', { ascending: true })
        if (error) throw error
        setMessages(data || [])
      } catch (err) {
        console.error(err)
        toast.error("메시지를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    
    // 입장 시 및 매 메시지 수신 시 리셋
    const { resetUnread } = useStore.getState()
    resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)

    // 2. 실시간 구독
    const filterConfig = chat.type === 'dm' 
      ? `receiver_id=eq.${user.id}` 
      : `room_id=eq.${chat.id}`
    
    console.log('🔔 Setting up realtime subscription:', {
      chatType: chat.type,
      chatId: chat.id,
      userId: user.id,
      filter: filterConfig
    })

    const channel = supabase
      .channel(`chat:${chat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: filterConfig
      }, (payload) => {
        const newMessage = payload.new as DMMessage
        
        console.log('📨 Received realtime message:', {
          messageId: newMessage.id,
          senderId: newMessage.sender_id,
          currentUserId: user.id,
          content: newMessage.content,
          roomId: newMessage.room_id,
          receiverId: newMessage.receiver_id
        })
        
        // DM의 경우 추가 필터링 (sender가 chat.id인지 확인)
        if (chat.type === 'dm' && newMessage.sender_id !== chat.id) {
          console.log('❌ Filtered out: DM sender mismatch')
          return
        }
        
        // 본인이 보낸 메시지는 이미 낙관적 업데이트로 추가되어 있음
        if (newMessage.sender_id === user.id) {
          console.log('✅ Own message - replacing optimistic update')
          // 낙관적 업데이트의 임시 메시지를 실제 메시지로 교체
          setMessages(prev => {
            const tempMsgIndex = prev.findIndex(m => 
              m.sender_id === user.id && 
              m.content === newMessage.content &&
              Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
            )
            
            if (tempMsgIndex !== -1) {
              // 임시 메시지를 실제 메시지로 교체
              const updated = [...prev]
              updated[tempMsgIndex] = newMessage
              return updated
            }
            return prev
          })
          return
        }

        // 다른 사람의 메시지만 추가
        console.log('✅ Adding message from other user')
        useStore.getState().resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)
        
        setMessages(prev => {
          // 중복 체크
          if (prev.some(m => m.id === newMessage.id)) {
            console.log('⚠️ Duplicate message, skipping')
            return prev
          }
          console.log('✅ Message added to state')
          return [...prev, newMessage]
        })
      })
      .subscribe((status) => {
        console.log('🔌 Subscription status:', status)
      })

    return () => {
      console.log('🔌 Unsubscribing from channel:', chat.id)
      supabase.removeChannel(channel)
    }
  }, [user, chat.id, chat.type])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !inputValue.trim()) return

    const content = inputValue.trim()
    const tempId = Math.random().toString(36).substring(7)
    const isAnon = chat.type === 'open'
    
    // 낙관적 업데이트
    const optimisticMsg: DMMessage = {
      id: tempId,
      sender_id: user.id,
      content,
      is_anonymous: isAnon,
      nickname: isAnon ? anonNickname : undefined,
      created_at: new Date().toISOString(),
      ...(chat.type === 'dm' ? { receiver_id: chat.id } : { room_id: chat.id })
    }
    
    setMessages(prev => [...prev, optimisticMsg])
    setInputValue("")

    try {
      const insertData: any = {
        sender_id: user.id,
        content,
        is_anonymous: isAnon,
        nickname: isAnon ? anonNickname : null
      }
      
      if (chat.type === 'dm') {
        insertData.receiver_id = chat.id
      } else {
        insertData.room_id = chat.id
      }

      const { error } = await supabase.from('direct_messages').insert(insertData)
      if (error) {
        console.error('❌ Supabase Insert Error:', error)
        console.error('📦 Insert Data:', insertData)
        throw error
      }
    } catch (err: any) {
      console.error('❌ Message Send Failed:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(`전송 실패: ${err.message || '알 수 없는 오류'}`)
    }
  }

  const isThemeAmber = chat.type === 'open'

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isThemeAmber ? 'bg-amber-950/20' : 'bg-slate-900/50'}`}>
      {/* DM Header */}
      <div className={`px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            {chat.type === 'open' ? (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
            ) : (
                <>
                    <img 
                        src={chat.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`}
                        className="w-8 h-8 rounded-full border border-white/20 bg-slate-800"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full" />
                </>
            )}
          </div>
          <div>
            <h3 className={`text-xs font-bold text-white uppercase tracking-tighter ${isThemeAmber ? 'text-amber-400' : ''}`}>
               {chat.type === 'open' ? `# ${chat.name}` : chat.name}
            </h3>
            <p className={`text-[10px] font-mono tracking-tighter uppercase flex items-center gap-1 ${isThemeAmber ? 'text-amber-500/70' : 'text-green-400'}`}>
              <Sparkles className="w-2 h-2" /> {chat.type === 'open' ? 'Anonymous Session' : 'Encrypted Link'}
              {chat.type === 'open' && <span className="ml-2 text-white/40">as {anonNickname}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-mono">SYNCHRONIZING SECURE STREAM...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                {!isOwn && (
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 px-1">
                        {msg.is_anonymous ? msg.nickname : (chat.type === 'group' ? 'Member' : chat.name)}
                    </span>
                )}
                <div className={`max-w-[85%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-xs font-mono shadow-lg border ${
                    isOwn 
                    ? isThemeAmber 
                        ? 'bg-gradient-to-br from-amber-600/30 to-orange-700/30 text-amber-50 border-amber-500/40 rounded-tr-none'
                        : 'bg-gradient-to-br from-indigo-500/20 to-blue-600/20 text-indigo-50 border-indigo-500/30 rounded-tr-none' 
                    : 'bg-white/5 text-white/90 border-white/10 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] text-white/20 font-mono mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t border-white/10 bg-black/40`}>
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={chat.type === 'open' ? `${anonNickname}(으)로 메시지 보내기...` : "Send an encrypted message..."}
            autoFocus
            className={`w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all font-mono text-xs ${
                isThemeAmber ? 'focus:border-amber-500/50' : 'focus:border-indigo-500/50'
            }`}
          />
          <button 
            disabled={!inputValue.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-20 transition-all ${
                isThemeAmber ? 'text-amber-500 hover:text-amber-400' : 'text-indigo-400 hover:text-indigo-300'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
