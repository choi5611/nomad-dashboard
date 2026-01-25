import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Hash, Users, ArrowRight, Info } from "lucide-react"
import type { ChatRoom } from "@/types/friend"

interface RoomPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  room: ChatRoom | null
  onJoin: (roomId: string, roomName: string) => void
}

export default function RoomPreviewModal({ isOpen, onClose, room, onJoin }: RoomPreviewModalProps) {
  if (!room) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-slate-900 border border-amber-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/50 hover:text-white transition-all backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="absolute -bottom-6 left-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-amber-500/50 flex items-center justify-center shadow-xl">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
              </div>
            </div>

            <div className="p-6 pt-10 space-y-6">
              {/* Title & Stats */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                    {room.name}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] font-bold font-mono">ACTIVE</span>
                  </div>
                </div>
                <p className="text-xs text-white/40 font-medium">Anonymous Public Lounge</p>
              </div>

              {/* Description */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-amber-500/50">
                  <Info className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">About this lounge</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  {room.description || "No mission statement provided for this lounge."}
                </p>
              </div>

              {/* Tags */}
              {room.tags && room.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {room.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-white/5 text-[10px] text-white/40 font-bold rounded-full border border-white/10">
                      <Hash className="w-2.5 h-2.5" /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action */}
              <button
                onClick={() => onJoin(room.id, room.name)}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 group"
              >
                Establish Connection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
