import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Send, ChevronLeft, Loader2, Sparkles, ArrowDown, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { toast } from "sonner"
import ConfirmModal from "@/components/ui/ConfirmModal"

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
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [anonNickname, setAnonNickname] = useState<string>("")
  
  // Smart Scroll States
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false)
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false)
  const lastMessageIdRef = useRef<string | null>(null)

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
          // console.log('🔍 Fetching DM messages for:', { userId: user.id, chatId: chat.id })
          
          const result = await supabase
            .from('direct_messages')
            .select('*, sender:profiles!sender_id(username, avatar_url, country_code)')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })
          
          // console.log('📦 DM Fetch Result:', result)
          
          if (result.error) {
              console.error('❌ DM Fetch Error:', result.error)
              throw result.error
          }
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

  // --- Smart Scroll Logic ---
  
  // 1. 스크롤 이벤트 핸들링: 사용자가 위로 올렸는지 감지
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    
    // 바닥에서 50px 이상 떨어져 있으면 "올려본 상태"로 간주
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsUserScrolledUp(!isAtBottom)

    // 바닥에 도달하면 새 메시지 알림 끄기
    if (isAtBottom) {
      setShowNewMessageAlert(false)
    }
  }

  // 2. 메시지가 추가될 때의 스크롤 동작
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    const isNew = lastMsg.id !== lastMessageIdRef.current
    lastMessageIdRef.current = lastMsg.id

    if (!isNew) return // 초기 로딩 등 변화 없을 땐 패스

    // 내 메시지면 무조건 내리기
    if (lastMsg.sender_id === user?.id || lastMsg.user_id === user?.id) {
        scrollToBottom()
        return
    }

    // 다른 사람 메시지일 때
    if (isUserScrolledUp) {
        // 보고 있는 위치가 위쪽이면 알림만 띄움
        setShowNewMessageAlert(true)
    } else {
        // 보고 있는 위치가 바닥이면 같이 내림
        scrollToBottom()
    }
  }, [messages, user?.id, isUserScrolledUp])

  const scrollToBottom = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth"
        })
    }
  }

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
    
    // 메시지 전송 직후 스크롤 강제 이동 (useEffect보다 확실하게)
    setTimeout(scrollToBottom, 10)

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

  const handleLeaveChat = async () => {
    if (!chat.type || chat.type !== 'group' || !user) return
    
    console.log('🚪 Attempting to leave chat:', {
        roomId: chat.id,
        userId: user.id
    })

    try {
        // 1. 멤버십 조회 (존재 여부 및 ID 확인)
        const { data: memberData, error: fetchError } = await supabase
            .from('room_members')
            .select('*')
            .eq('room_id', chat.id)
            .eq('user_id', user.id)
            .maybeSingle()

        console.log('🔍 Membership Check:', { memberData, fetchError })

        if (fetchError) throw fetchError
        
        if (!memberData) {
            toast.error("멤버 정보를 찾을 수 없습니다. (이미 나갔거나 접근 권한 없음)")
            // 목록 갱신을 위해 뒤로 가기
            onBack()
            return
        }

        // [중요] 시스템 메시지를 먼저 전송
        // App.tsx의 incrementUnread 로직이 이미 본인 메시지(user_id === currentUserId)는 카운트하지 않으므로
        // 나가는 사람은 자신의 나가기 메시지로 인한 알림을 받지 않음
        try {
             await supabase.from('group_messages').insert({
                room_id: chat.id,
                user_id: user.id,
                content: `[SYSTEM] ${profile?.username || 'Unknown'}님이 나갔습니다.`
            })
        } catch (msgErr) {
            console.error('Failed to send leave message', msgErr)
            // 메시지 전송 실패해도 나가기는 진행
        }

        // 2. 멤버십 삭제 (ID가 있으면 ID로, 없으면 기존 방식)
        let deleteQuery = supabase.from('room_members').delete({ count: 'exact' })
        
        if (memberData.id) {
            console.log('🎯 Deleting by Primary Key ID:', memberData.id)
            deleteQuery = deleteQuery.eq('id', memberData.id)
        } else {
            console.log('🎯 Deleting by Composite Key')
            deleteQuery = deleteQuery.eq('room_id', chat.id).eq('user_id', user.id)
        }

        const { error: deleteError, count } = await deleteQuery
            
        console.log('🗑️ Delete Result:', { deleteError, count })

        if (deleteError) throw deleteError
        
        if (count === 0) {
            toast.error("삭제 실패: 권한(RLS) 부족 가능성이 있습니다.")
            return
        }
        
        toast.success("채팅방을 나갔습니다.")
        onBack()
    } catch (err: any) {
        console.error('❌ Leave Chat Error:', err)
        toast.error("오류 발생: " + err.message)
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
        
        {/* Leave Button (Only for Group Chat) */}
        {chat.type === 'group' && (
            <button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="p-2 hover:bg-red-500/10 rounded-lg text-white/30 hover:text-red-400 transition-all group relative"
                title="Leave Chat"
            >
                <LogOut className="w-4 h-4" />
            </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-mono">SYNCHRONIZING SECURE STREAM...</p>
          </div>
        ) : (
          messages.map((msg) => {
            // [SYSTEM] 메시지 처리
            if (msg.content.startsWith('[SYSTEM]')) {
                return (
                    <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center my-4"
                    >
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-white/30 font-mono tracking-tighter border border-white/5 flex items-center gap-2">
                             <LogOut className="w-3 h-3" />
                            {msg.content.replace('[SYSTEM]', '').trim()}
                        </span>
                    </motion.div>
                )
            }

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

      {/* New Message Alert Trigger */}
      {showNewMessageAlert && (
        <div className="absolute bottom-[80px] left-0 right-0 flex justify-center z-10 pointer-events-none">
            <button 
                onClick={() => {
                    scrollToBottom()
                    setShowNewMessageAlert(false)
                }}
                className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/20 text-xs font-bold animate-bounce"
            >
                <ArrowDown className="w-3 h-3" />
                New Message
            </button>
        </div>
      )}

      {/* Input Area */}
      <div className={`p-4 border-t border-white/10 bg-black/40 relative z-20`}>
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

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        title="Leave Group Chat"
        message="정말 이 채팅방을 나가시겠습니까? 대화 내용은 더 이상 볼 수 없습니다."
        confirmText="나가기"
        cancelText="취소"
        onConfirm={handleLeaveChat}
        onClose={() => setIsLeaveModalOpen(false)}
      />
    </div>
  )
}
