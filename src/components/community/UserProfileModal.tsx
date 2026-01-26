import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, UserPlus, MessageSquare, Loader2, Award, Calendar, FileText, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { toast } from "sonner"
import { getNomadRank } from "@/utils/rankUtils"
import TravelLog from "./TravelLog"
import { useInfinitePosts } from "@/hooks/useInfinitePosts"
import PostCard from "./PostCard"

interface UserProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

type TabType = 'bio' | 'travel' | 'activity'

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none')
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('bio')

  // 프로필 및 친구 상태 조회
  useEffect(() => {
    if (isOpen && userId) {
      fetchData()
      setActiveTab('bio') // 모달 열릴 때 탭 초기화

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
      
      await supabase.from('notifications').insert({
        receiver_id: userId,
        sender_id: currentUser.id,
        type: 'friend_request',
        post_id: null
      })
      
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
                {/* Header Section */}
                <div className="relative shrink-0">
                    <div className="h-24 bg-gradient-to-br from-indigo-950 to-slate-900 relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/60 hover:text-white transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-6 flex flex-col items-center -mt-12 relative pb-4 border-b border-white/5">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full border-4 border-slate-900 shadow-2xl overflow-hidden bg-slate-800 ring-1 ring-white/10">
                             <img 
                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h2 className="mt-3 text-xl font-bold text-white flex items-center gap-2">
                          <span>{profile?.username}</span>
                          <span className="text-lg">{profile?.country_code ? getFlagEmoji(profile.country_code) : ''}</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Nomad Authenticated</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Wrapper */}
                <div className="flex px-4 pt-4 shrink-0">
                    <div className="flex w-full bg-white/5 p-1 rounded-2xl border border-white/10">
                        {(['bio', 'travel', 'activity'] as TabType[]).map((tab) => (
                           <button
                             key={tab}
                             onClick={() => setActiveTab(tab)}
                             className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${
                               activeTab === tab ? "bg-white/10 text-cyan-400 shadow-inner" : "text-white/20 hover:text-white/40"
                             }`}
                           >
                             {tab === 'bio' && <Award className="w-4 h-4 mb-1" />}
                             {tab === 'travel' && <Calendar className="w-4 h-4 mb-1" />}
                             {tab === 'activity' && <FileText className="w-4 h-4 mb-1" />}
                             <span className="text-[9px] font-bold uppercase tracking-tighter">{tab}</span>
                           </button>
                        ))}
                    </div>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar min-h-[300px]">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === 'bio' && (
                                <motion.div
                                    key="bio"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 ${rank?.color}`}>
                                        <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                                            {RankIcon && <RankIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] opacity-60 uppercase font-extrabold tracking-widest">Global Rank</p>
                                            <p className="text-lg font-bold leading-tight">{rank?.name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] text-white/40 mb-1 font-extrabold tracking-widest uppercase">XP Score</p>
                                            <p className="text-xl font-bold text-cyan-400">{profile?.xp?.toLocaleString() || 0}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] text-white/40 mb-1 font-extrabold tracking-widest uppercase">Verified Since</p>
                                            <p className="text-sm font-bold text-white mt-1">{new Date(profile?.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'travel' && (
                                <motion.div
                                    key="travel"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {profile?.is_private_log && currentUser?.id !== userId ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4">
                                            <div className="p-4 bg-white/5 rounded-full border border-white/10">
                                                <Award className="w-8 h-8 text-white/20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-white/60">Signal Encrypted</p>
                                                <p className="text-[10px] text-white/20 uppercase tracking-widest">This nomad's travel log is private.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <TravelLog userId={userId} compact />
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'activity' && (
                                <motion.div
                                    key="activity"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {/* 이 부분은 MyActivityList가 본인 계정만 보여주게 되어있으므로, 
                                        현재는 프로필 주인의 대상을 넘겨줄 수 있도록 수정 가능 */}
                                    <div className="space-y-4">
                                       <div className="flex items-center gap-2 mb-4 px-1">
                                          <FileText className="w-4 h-4 text-cyan-400" />
                                          <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] opacity-60">Communication Logs</h3>
                                       </div>
                                       {/* MyActivityList 대신 간단한 유저 게시글 리스트 컴포넌트 필요할 수 있음 */}
                                       <ActivityWrapper userId={userId} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer Action */}
                {!loading && currentUser && currentUser.id !== userId && (
                   <div className="p-6 pt-0 shrink-0">
                      {friendStatus === 'none' && (
                          <button
                              onClick={sendFriendRequest}
                              disabled={actionLoading}
                              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                              <span>SEND SIGNAL INVITATION</span>
                          </button>
                      )}
                      {friendStatus === 'pending_sent' && (
                          <div className="w-full py-4 bg-white/5 border border-white/10 text-white/30 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-default uppercase text-xs tracking-widest">
                              <Loader2 className="w-4 h-4 animate-spin opacity-20" />
                              <span>Signal Pending</span>
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
                              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all uppercase text-sm tracking-tighter"
                          >
                              <MessageSquare className="w-5 h-5" />
                              <span>ESTABLISH DIRECT LINK</span>
                          </button>
                      )}
                   </div>
                )}
            </motion.div>
        </motion.div>
    </AnimatePresence>
  )
}

// ActivityWrapper for handling User ID specific posts
function ActivityWrapper({ userId }: { userId: string }) {
   const { data } = useInfinitePosts({
     category: "all",
     authorId: userId
   })
   const posts = data?.pages.flatMap(p => p) || []

   if (posts.length === 0) return <p className="text-xs text-white/20 italic">No public logs found.</p>

   return (
     <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="w-full">
             <PostCard 
                post={post} 
                typeIcon={MapPin} 
                typeLabel="LOG" 
             />
          </div>
        ))}
     </div>
   )
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
