import { useRef, useEffect } from "react"
import { useLeaderboard } from "@/hooks/useLeaderboard"
import { useAuth } from "@/store/useAuth"
import { X, Trophy, Medal, Crown } from "lucide-react"

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const { data: rankings, isLoading } = useLeaderboard()
  const { user } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  if (!isOpen) return null

  const myRankIndex = rankings?.findIndex(p => p.id === user?.id)
  const myRank = myRankIndex !== undefined && myRankIndex !== -1 ? myRankIndex + 1 : null
  const myData = rankings && myRankIndex !== undefined && myRankIndex !== -1 ? rankings[myRankIndex] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Nomad Leaderboard</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            rankings?.map((profile, index) => {
              const rank = index + 1
              const isMe = profile.id === user?.id
              
              let RankIcon = null
              let rankColor = "text-zinc-500"
              let bgGlow = ""

              if (rank === 1) {
                RankIcon = <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                rankColor = "text-yellow-400 font-bold"
                bgGlow = "bg-yellow-400/10 border-yellow-400/20"
              } else if (rank === 2) {
                RankIcon = <Medal className="w-5 h-5 text-zinc-300" />
                rankColor = "text-zinc-300 font-bold"
                bgGlow = "bg-white/5"
              } else if (rank === 3) {
                RankIcon = <Medal className="w-5 h-5 text-amber-600" />
                rankColor = "text-amber-600 font-bold"
                bgGlow = "bg-amber-600/5"
              }

              return (
                <div 
                  key={profile.id}
                  className={`flex items-center gap-4 p-3 rounded-xl border border-transparent transition-all ${
                    isMe ? 'bg-cyan-500/10 border-cyan-500/30' : 'hover:bg-white/5'
                  } ${bgGlow}`}
                >
                  <div className={`w-8 flex justify-center ${rankColor} text-lg`}>
                    {RankIcon || rank}
                  </div>
                  
                  <div className="flex-shrink-0 relative">
                    <img 
                      src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                      alt={profile.username || "User"} 
                      className="w-10 h-10 rounded-full bg-zinc-800 object-cover border border-white/10"
                    />
                    {isMe && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <span className={`font-medium truncate ${isMe ? 'text-cyan-400' : 'text-white'}`}>
                         {profile.username || "익명 노마드"}
                       </span>
                       {profile.country_code && (
                         <span className="text-xs text-zinc-500">
                           {/* 국기를 이모지로 보여줄 수도 있음 */}
                           {profile.country_code}
                         </span>
                       )}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                      Nomad Level {Math.floor((profile.xp || 0) / 100) + 1}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-white tabular-nums">
                      {profile.xp?.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* My Sticky Footer (if I am ranked but scrolled away, or just always show?) */}
        {/* Let's just show it always if user is logged in */}
        {user && myData && (
          <div className="p-4 bg-zinc-900/90 border-t border-white/10 backdrop-blur">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <div className="w-8 text-center text-cyan-400 font-bold text-lg">
                {myRank}
              </div>
              <img 
                src={myData.avatar_url || ""} 
                alt="Me" 
                className="w-10 h-10 rounded-full bg-zinc-800 object-cover"
              />
              <div className="flex-1">
                <div className="font-bold text-white">나의 순위</div>
                <div className="text-xs text-cyan-400">
                   상위 {rankings && myRank ? ((myRank / rankings.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-right font-bold text-white">
                {myData.xp?.toLocaleString()} XP
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
