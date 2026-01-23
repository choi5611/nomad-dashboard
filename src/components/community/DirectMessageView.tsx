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
  sender_id?: string  // DM
  user_id?: string    // Group
  receiver_id?: string
  room_id?: string
  content: string
  is_anonymous?: boolean
  nickname?: string
  created_at: string
  // Joined fields
  sender?: {
    username: string
    avatar_url: string | null
    country_code?: string
  }
  profiles?: {
    username: string
    avatar_url: string | null
    country_code?: string
  }
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
        let data, error
        
        if (chat.type === 'dm') {
          const result = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })
          data = result.data
          error = result.error
        } else if (chat.type === 'group') {
          // 그룹 채팅은 group_messages 테이블 사용
          const result = await supabase
            .from('group_messages')
            .select('*, sender:profiles(username, avatar_url)')
            .eq('room_id', chat.id)
            .order('created_at', { ascending: true })
          data = result.data
          error = result.error
        } else {
          // 오픈 채팅은 direct_messages 사용
          const result = await supabase
            .from('direct_messages')
            .select('*')
            .eq('room_id', chat.id)
            .order('created_at', { ascending: true })
          data = result.data
          error = result.error
        }

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
    const tableName = chat.type === 'group' ? 'group_messages' : 'direct_messages'
    const filterConfig = chat.type === 'dm' 
      ? `receiver_id=eq.${user.id}` 
      : `room_id=eq.${chat.id}`
    
    console.log('🔔 Setting up realtime subscription:', {
      chatType: chat.type,
      chatId: chat.id,
      userId: user.id,
      tableName
    })

    const channel = supabase
      .channel(`chat:${chat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: filterConfig
      }, async (payload) => {
        const newMessage = payload.new as any
        
        // 그룹 메시지의 경우 sender 정보가 필요할 수 있음
        if (chat.type === 'group' && !newMessage.sender) {
             const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMessage.sender_id || newMessage.user_id) // user_id might be used in group_messages
            .single()
            if (data) newMessage.sender = data
        }

        console.log('📨 Received realtime message:', newMessage)
        
        // DM의 경우 추가 필터링
        if (chat.type === 'dm' && newMessage.sender_id !== chat.id) return
        
        // 본인이 보낸 메시지는 낙관적 업데이트 처리 (ID 교체 등)
        const senderId = newMessage.sender_id || newMessage.user_id
        if (senderId === user.id) {
           setMessages(prev => {
            const tempMsgIndex = prev.findIndex(m => 
              m.sender_id === user.id && 
              m.content === newMessage.content &&
              Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
            )
            if (tempMsgIndex !== -1) {
              const updated = [...prev]
              updated[tempMsgIndex] = { ...updated[tempMsgIndex], ...newMessage } // ID 등 업데이트
              return updated
            }
            return prev
          })
          return
        }

        // 다른 사람 메시지 추가
        useStore.getState().resetUnread(chat.type === 'dm' ? 'dm' : 'room', chat.id)
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, chat.id, chat.type])

  // ... (scroll effect)

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
      if (chat.type === 'group') {
          // 그룹 메시지는 group_messages 테이블 사용
          const { error } = await supabase.from('group_messages').insert({
              room_id: chat.id,
              user_id: user.id, // group_messages uses user_id as sender
              content
          })
          if (error) throw error
      } else {
          // DM 및 오픈 채팅
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
          if (error) throw error
      }
    } catch (err: any) {
      console.error('❌ Message Send Failed:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(`전송 실패: ${err.message}`)
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
            // sender_id(DM) 혹은 user_id(Group) 체크
            const senderId = msg.sender_id || msg.user_id
            const isOwn = senderId === user?.id
            
            // 프로필 정보: msg.profiles(DM) 혹은 msg.sender(Group)
            // 혹은 실시간 메시지의 경우 msg.sender 객체가 직접 있을 수 있음
            const senderProfile = msg.sender || (msg.profiles as any)
            const username = senderProfile?.username || msg.nickname || 'Unknown'
            const avatarUrl = senderProfile?.avatar_url
            const countryCode = senderProfile?.country_code
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                {!isOwn && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                        {avatarUrl && (
                            <img src={avatarUrl} className="w-4 h-4 rounded-full bg-slate-800 object-cover" />
                        )}
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                            {countryCode && <span>{countryCode}</span>}
                            {msg.is_anonymous ? msg.nickname : username}
                        </span>
                    </div>
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
