import { motion } from "framer-motion"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { toast } from "sonner"

interface PostActionsProps {
  isLiked: boolean
  likeCount: number
  commentCount: number
  showComments: boolean
  onToggleLike: () => void
  onToggleComments: () => void
  content?: string // For sharing
}

export default function PostActions({
  isLiked,
  likeCount,
  commentCount,
  showComments,
  onToggleLike,
  onToggleComments,
  content
}: PostActionsProps) {
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(content || window.location.href)
      toast.success("게시글 내용이 클립보드에 복사되었습니다!")
    } catch (err) {
      toast.error("복사에 실패했습니다.")
    }
  }

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
        <span>{likeCount}</span>
      </button>
      
      <button
        onClick={onToggleComments}
        className={`flex items-center gap-1 transition-colors ${
          showComments ? "text-cyan-400" : "hover:text-cyan-400"
        }`}
      >
        <MessageCircle className="w-4 h-4" /> <span>{commentCount}</span>
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1 transition-colors hover:text-green-400 ml-auto"
        title="내용 복사"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  )
}
