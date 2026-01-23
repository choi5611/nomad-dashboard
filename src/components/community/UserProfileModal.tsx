import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, UserPlus, MessageSquare, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { toast } from "sonner"
import { getNomadRank } from "@/utils/rankUtils"

interface UserProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none')
  const [actionLoading, setActionLoading] = useState(false)

  // 프로필 및 친구 상태 조회
  useEffect(() => {
    if (isOpen && userId) {
      fetchData()

      // 실시간 친구 상태 구독
      const channel = supabase
        .channel(`profile-friendship-${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `or(and(user_id.eq.${currentUser?.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser?.id}))`
        }, () => {
          fetchData()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isOpen, userId, currentUser])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. 상대방 프로필 조회
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) throw profileError
      setProfile(profileData)

      // 2. 친구 상태 조회 (로그인 시)
      if (currentUser && currentUser.id !== userId) {
        const { data: friendData, error: friendError } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`)
          .maybeSingle()

        if (!friendError && friendData) {
          if (friendData.status === 'accepted') {
            setFriendStatus('accepted')
          } else if (friendData.user_id === currentUser.id) {
            setFriendStatus('pending_sent')
          } else {
            setFriendStatus('pending_received')
          }
        } else {
          setFriendStatus('none')
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("프로필을 불러오지 못했습니다.")
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async () => {
    if (!currentUser) return toast.error("로그인이 필요합니다.")
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUser.id,
          friend_id: userId
        })
      
      if (error) throw error
      
      setFriendStatus('pending_sent')
      toast.success("친구 요청을 보냈습니다!")
      
      // 알림 전송 (실패해도 친구 요청은 성공)
      const { error: notifError } = await supabase.from('notifications').insert({
        receiver_id: userId,
        sender_id: currentUser.id,
        type: 'friend_request',
        post_id: null
      })

      if (notifError) {
        console.error('Notification send failed:', notifError)
      }
      
    } catch (error: any) {
      toast.error("요청 실패: " + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!isOpen) return null

  const rank = profile ? getNomadRank(profile.xp) : null
  const RankIcon = rank?.icon

  return (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
            >
                {/* Header Pattern */}
                <div className="h-24 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                ) : (
                    <div className="px-6 pb-8 -mt-12 relative flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full border-4 border-slate-900 shadow-xl overflow-hidden bg-slate-800">
                             <img 
                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Name & Flags */}
                        <div className="mt-3">
                             <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                {profile?.username}
                                <span className="text-lg shadow-sm">{profile?.country_code ?  ` ${getFlagEmoji(profile.country_code)}` : ''}</span>
                             </h2>
                             <p className="text-sm text-white/40 mt-0.5">{profile?.email}</p>
                        </div>

                        {/* Rank Badge */}
                        {rank && (
                            <div className={`mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 ${rank.color}`}>
                                <RankIcon className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-wider">Rank</p>
                                    <p className="text-sm font-bold leading-none">{rank.name}</p>
                                </div>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 w-full mt-6">
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                <p className="text-xs text-white/40 mb-1 font-bold">XP SCORE</p>
                                <p className="text-lg font-bold text-cyan-400">{profile?.xp || 0}</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                <p className="text-xs text-white/40 mb-1 font-bold">JOINED</p>
                                <p className="text-sm font-bold text-white">{new Date(profile?.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {currentUser && currentUser.id !== userId && (
                            <div className="w-full mt-6">
                                {friendStatus === 'none' && (
                                    <button
                                        onClick={sendFriendRequest}
                                        disabled={actionLoading}
                                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                        친구 요청 보내기
                                    </button>
                                )}
                                {friendStatus === 'pending_sent' && (
                                    <div className="w-full py-3 bg-white/5 border border-white/10 text-white/30 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                                        <UserPlus className="w-5 h-5 opacity-20" />
                                        승인 대기 중
                                    </div>
                                )}
                                {friendStatus === 'accepted' && (
                                    <button
                                        onClick={() => {
                                            const { setActiveChat, toggleChat } = (useStore as any).getState()
                                            setActiveChat({
                                                type: 'dm',
                                                id: userId,
                                                name: profile.username,
                                                avatar_url: profile.avatar_url
                                            })
                                            toggleChat()
                                            onClose()
                                        }}
                                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        1:1 대화하기
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    </AnimatePresence>
  )
}

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
