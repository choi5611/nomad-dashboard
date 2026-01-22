import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Layers, Trash2 } from "lucide-react"
import { useAuth } from "@/store/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import CommentSection from "./CommentSection"
import ConfirmModal from "../ui/ConfirmModal"
import HashtagText from "../ui/HashtagText"
// 이 컴포넌트가 받아서 사용할 데이터들의 "타입"을 정의해줍니다.
interface PostCardProps {
  post: {
    id: string
    content: string
    category: string
    created_at: string
    author_id: string
    image_urls?: string[] | null
    profiles: {
      username: string | null
      avatar_url: string | null
    } | null
    likes_count?: number
    comments_count?: number
  }
  typeIcon: any
  typeLabel: string
  onDelete?: () => void
  onTagClick?: (tag: string) => void
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}
export default function PostCard({ post, typeIcon: TypeIcon, typeLabel, onDelete, onTagClick }: PostCardProps) {
  const user = useAuth((state) => state.user)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [[page, direction], setPage] = useState([0, 0])
  
  const authorName = post.profiles?.username || "익명"
  const avatarUrl = post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`
  const formattedDate = new Date(post.created_at).toLocaleDateString()
  const isAuthor = user?.id === post.author_id

  useEffect(() => {
    if (user) {
      checkIfLiked()
    }
  }, [user, post.id])

  // 부모로부터 받은 카운트가 변경되면 로컬 상태도 업데이트해줍니다.
  useEffect(() => {
    setLikeCount(post.likes_count || 0)
    setCommentCount(post.comments_count || 0)
  }, [post.likes_count, post.comments_count])

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("likes")
      .select("user_id")
      .eq("post_id", post.id)
      .eq("user_id", user!.id)
      .maybeSingle()
    
    setIsLiked(!!data)
  }

  const toggleLike = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.")
      return
    }

    // Optimistic Update
    const prevIsLiked = isLiked
    const prevCount = likeCount
    
    setIsLiked(!prevIsLiked)
    setLikeCount(prev => prevIsLiked ? prev - 1 : prev + 1)

    try {
      if (prevIsLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: post.id, user_id: user.id })
        if (error) throw error
      }
    } catch (error) {
      // Revert on error
      setIsLiked(prevIsLiked)
      setLikeCount(prevCount)
      toast.error("좋아요 처리 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
      
      if (error) throw error
      
      toast.success("게시글이 삭제되었습니다.")
      if (onDelete) onDelete()
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다.")
    }
  }

  const images = post.image_urls || []
  const currentImageIndex = Math.abs(page % images.length)
  const hasMultipleImages = images.length > 1

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection])
  }

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-colors group relative">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-3">
        <img src={avatarUrl} alt={authorName} className="w-10 h-10 rounded-full bg-slate-700" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{authorName}</span>
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                <TypeIcon className="w-3 h-3" />
                {typeLabel}
              </span>
            </div>
            {isAuthor && (
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-xs text-white/50">{formattedDate}</span>
        </div>
      </div>
      {/* Content */}
      <div className="text-white/90 text-sm leading-relaxed mb-3">
        <HashtagText text={post.content} onTagClick={onTagClick} />
      </div>
      {/* Image */}
      {/* Images Carousel */}
      {images.length > 0 && (
        <div className="relative mb-3 group select-none h-[300px]">
          <div className="w-full h-full rounded-lg overflow-hidden bg-black/20 relative">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute inset-0 w-full h-full"
              >
                {(() => {
                  const url = images[currentImageIndex]
                  const isVideo = url.toLowerCase().match(/\.(mp4|mov|webm|ogv|m4v)/) || url.includes('/post-videos/')
                  
                  if (isVideo) {
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-black">
                         <video
                            src={url}
                            className="w-full h-full object-cover"
                            controls={false}
                            autoPlay
                            muted
                            loop
                            playsInline
                         />
                      </div>
                    )
                  }
                  return (
                    <img 
                      src={url} 
                      alt={`post-image-${currentImageIndex}`} 
                      className="w-full h-full object-cover"
                    />
                  )
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {hasMultipleImages && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/90 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/90 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all box-shadow-sm ${
                      currentImageIndex === idx ? "bg-white scale-125" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
              
              {/* Image Counter Badge (top right) */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1 backdrop-blur-sm">
                <Layers className="w-3 h-3" />
                {currentImageIndex + 1}/{images.length}
              </div>
            </>
          )}
        </div>
      )}
      {/* Actions */}
      <div className="flex items-center gap-4 text-white/50 text-sm">
        <button 
          onClick={toggleLike}
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
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1 transition-colors ${
            showComments ? "text-cyan-400" : "hover:text-cyan-400"
          }`}
        >
          <MessageCircle className="w-4 h-4" /> {commentCount}
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <CommentSection 
          postId={post.id} 
          onCommentCountChange={setCommentCount}
        />
      )}
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다."
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  )
}