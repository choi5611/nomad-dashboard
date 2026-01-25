import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, UserPlus, Search, Check, Loader2, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Friend } from "@/types/friend"

interface InviteFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  currentMemberIds: string[]
  friends: Friend[]
  onSuccess: () => void
}

export default function InviteFriendsModal({
  isOpen,
  onClose,
  roomId,
  currentMemberIds,
  friends,
  onSuccess
}: InviteFriendsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviting, setIsInviting] = useState(false)

  // 이미 방에 있는 친구 제외
  const inviteableFriends = friends.filter(f => !currentMemberIds.includes(f.id))
  
  const filteredFriends = inviteableFriends.filter(f => 
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleInvite = async () => {
    if (selectedIds.length === 0) return
    setIsInviting(true)

    try {
      const newMembers = selectedIds.map(userId => ({
        room_id: roomId,
        user_id: userId
      }))

      const { error } = await supabase
        .from('room_members')
        .insert(newMembers)

      if (error) throw error

      toast.success(`${selectedIds.length}명의 친구를 초대했습니다!`)
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Invite error:', err)
      toast.error("초대 실패: " + err.message)
    } finally {
      setIsInviting(false)
    }
  }

  const handleClose = () => {
    setSelectedIds([])
    setSearchTerm("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Invite Nomads</h3>
                <p className="text-[10px] text-indigo-400/60 font-mono tracking-widest uppercase">Expand your crew</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search nomads..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 no-scrollbar min-h-[200px]">
            {filteredFriends.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
                <Users className="w-8 h-8" />
                <p className="text-xs">초대할 수 있는 친구가 없습니다.</p>
              </div>
            ) : (
              filteredFriends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => toggleSelect(friend.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    selectedIds.includes(friend.id)
                      ? "bg-indigo-500/20 border-indigo-500/50"
                      : "bg-white/5 border-transparent hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                      className="w-8 h-8 rounded-full bg-slate-800" 
                    />
                    <span className="text-sm font-bold text-white">{friend.username}</span>
                  </div>
                  {selectedIds.includes(friend.id) && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-6 mt-4 border-t border-white/5">
            <button
              disabled={selectedIds.length === 0 || isInviting}
              onClick={handleInvite}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Send Invitations (${selectedIds.length})`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
