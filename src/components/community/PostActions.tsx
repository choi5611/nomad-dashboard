import { motion } from "framer-motion"
import { Heart, MessageCircle } from "lucide-react"

interface PostActionsProps {
  isLiked: boolean
  likeCount: number
  commentCount: number
  showComments: boolean
  onToggleLike: () => void
  onToggleComments: () => void
}

export default function PostActions({
  isLiked,
  likeCount,
  commentCount,
  showComments,
  onToggleLike,
  onToggleComments
}: PostActionsProps) {
  return (
    <div className="flex items-center gap-4 text-white/50 text-sm">
      <button
        onClick={onToggleLike}
        className={`flex items-center gap-1 transition-colors ${
          isLiked ? "text-pink-500" : "hover:text-pink-400"
        }`}
      >
        <motion.div
          animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
        </motion.div>
        {likeCount}
      </button>
      <button
        onClick={onToggleComments}
        className={`flex items-center gap-1 transition-colors ${
          showComments ? "text-cyan-400" : "hover:text-cyan-400"
        }`}
      >
        <MessageCircle className="w-4 h-4" /> {commentCount}
      </button>
    </div>
  )
}
