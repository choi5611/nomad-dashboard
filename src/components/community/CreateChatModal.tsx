import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Hash, Lock, Globe, Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import type { ChatRoom } from "@/types/friend"

interface CreateChatModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: (roomId: string, roomName: string, isOpen?: boolean) => void
  initialData?: ChatRoom | null // 추가: 수정 모드용
}

export default function CreateChatModal({ isOpen, onClose, user, onSuccess, initialData }: CreateChatModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isOpenChat, setIsOpenChat] = useState(true)
  const [tags, setTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!initialData

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name)
        setDescription(initialData.description || "")
        setIsOpenChat(initialData.is_open ?? true)
        setTags(initialData.tags?.join(", ") || "")
      } else {
        setName("")
        setDescription("")
        setIsOpenChat(true)
        setTags("")
      }
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!name.trim()) {
      toast.error("방 이름을 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    try {
      const tagArray = tags
        .split(/[,\s]+/)
        .filter(tag => tag.length > 0)
        .map(tag => tag.replace(/^#/, ""))

      const roomData = {
        name: name.trim(),
        description: description.trim() || null,
        is_open: isOpenChat,
        tags: tagArray,
      }

      if (isEditMode) {
      

        const { data: updateResult, error: updateError } = await supabase
          .from('chat_rooms')
          .update(roomData)
          .eq('id', initialData.id)
          .select()


        if (updateError) {
          console.error('chat_rooms update failed:', updateError)
          throw updateError
        }

        if (!updateResult || updateResult.length === 0) {
          console.error('No rows updated in chat_rooms - possible RLS issue')
          toast.error("개설자만 수정할 수 있습니다.")
          return
        }

        // 개설자의 custom_name도 업데이트 (FRIENDS 탭에서 표시되도록)
        const { error: memberError } = await supabase
          .from('room_members')
          .update({ custom_name: name.trim() })
          .eq('room_id', initialData.id)
          .eq('user_id', user.id)
          .select()

        if (memberError) {
          console.error('room_members update failed:', memberError)
          throw memberError
        }
          

        toast.success("방 정보가 수정되었습니다!")
        onSuccess(initialData.id, name.trim(), isOpenChat)
      } else {
        const { data, error } = await supabase
          .from('chat_rooms')
          .insert({
            ...roomData,
            created_by: user.id
          })
          .select()
          .single()

        if (error) throw error

        // 멤버로 자동 추가
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({
            room_id: data.id,
            user_id: user.id
          })

        if (memberError) throw memberError
        toast.success("채팅방이 생성되었습니다!")
        onSuccess(data.id, data.name, data.is_open)
      }
      handleClose()
    } catch (err: any) {
      console.error('Room action error:', err)
      toast.error(`${isEditMode ? "수정" : "생성"} 실패: ` + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isEditMode) {
      setName("")
      setDescription("")
      setIsOpenChat(true)
      setTags("")
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.1)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  {isEditMode ? "Update Channel" : "Create Channel"}
                </h3>
                <p className="text-[10px] text-amber-500/60 font-mono tracking-widest uppercase">
                  {isEditMode ? "Manage your community settings" : "Start a new conversation"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Channel Name</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-500/5 rounded-xl blur-sm group-focus-within:bg-amber-500/10 transition-all" />
                <input
                  type="text"
                  maxLength={10}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="예: 서울노마드 (최대 10자)"
                  className="relative w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
                  autoFocus={!isEditMode}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Mission / Description</label>
              <textarea
                maxLength={100}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="어떤 이야기를 나누는 곳인가요? (최대 100자)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all text-sm h-24 resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Hash className="w-3 h-3" /> <span>Search Tags</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="공백이나 쉼표로 구분 (예: 개발, 여행, 서울)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOpenChat ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"}`}>
                  {isOpenChat ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{isOpenChat ? "Public Lounge" : "Private Group"}</p>
                  <p className="text-[9px] text-white/40 uppercase">{isOpenChat ? "Everyone can join & search" : "Invite only channel"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenChat(!isOpenChat)}
                className={`w-12 h-6 rounded-full transition-all relative ${isOpenChat ? "bg-amber-500" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOpenChat ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all"
              >
                {isEditMode ? "Cancel" : "Abort"}
              </button>
              <button
                disabled={!name.trim() || isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditMode ? (
                  <><Save className="w-4 h-4" /> <span>Save Changes</span></>
                ) : (
                  <span>Initialize</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
