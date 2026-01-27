import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { usePostLike } from "@/hooks/usePostLike"
import { useImageCarousel } from "@/hooks/useImageCarousel"
import PostHeader from "./PostHeader"
import PostContent from "./PostContent"
import ImageCarousel from "./ImageCarousel"
import PostActions from "./PostActions"
import CommentSection from "./CommentSection"
import ConfirmModal from "../ui/ConfirmModal"
import UserProfileModal from "./UserProfileModal"

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
  disableProfileClick?: boolean
}

export default function PostCard({ post, typeIcon, typeLabel, onDelete, onTagClick, disableProfileClick }: PostCardProps) {
  const user = useAuth((state) => state.user)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const navigationTarget = useStore((state) => state.navigationTarget)

  const authorName = post.profiles?.username || "익명"
  const avatarUrl = post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`
  const formattedDate = new Date(post.created_at).toLocaleDateString()
  const isAuthor = user?.id === post.author_id

  // 좋아요 훅
  const { isLiked, likeCount, toggleLike } = usePostLike(
    post.id,
    post.author_id,
    user,
    post.likes_count || 0
  )

  // 이미지 캐러셀 훅
  const images = post.image_urls || []
  const { page, direction, currentImageIndex, hasMultipleImages, paginate } = useImageCarousel(images.length)

  useEffect(() => {
    setCommentCount(post.comments_count || 0)
  }, [post.comments_count])

  // 알림 등으로 인한 네비게이션 처리
  useEffect(() => {
    if (navigationTarget?.postId === post.id) {
      setShowComments(true)
      // 약간의 지연을 주어 UI가 확장된 후 스크롤되도록 함
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [navigationTarget, post.id])

  const handleDelete = async () => {
    if (!user) return
    
    try {
      console.log(`🚀 Attempting to delete post: ${post.id} (Current User: ${user.id}, Author: ${post.author_id})`)
      
      // 1. 본문 삭제 (작성자 ID를 조건에 추가하여 RLS 권한을 한 번 더 보증)
      const { error, count } = await supabase
        .from("posts")
        .delete({ count: 'exact' })
        .eq("id", post.id)
        .eq("author_id", user.id) // 보안 강화: 내 글이 아니면 아예 요청도 안 먹히게

      if (error) throw error
      
      if (count === 0) {
        console.warn("⚠️ No rows deleted. Potential reasons: Already deleted or permission denied.")
        throw new Error("삭제할 수 없는 게시글이거나 권한이 없습니다.")
      }

      console.log("✅ Database confirmed deletion.")
      
      // 3. XP 환수 (-10 XP) - 어뷰징 방지
      await supabase.rpc('increment_xp', { user_id: user.id, amount: -10 })
      useAuth.getState().fetchProfile(user.id)

      toast.success("게시글이 삭제되었습니다.")
      
      // 4. UI 즉시 갱신
      setTimeout(() => {
        if (onDelete) onDelete()
      }, 300)
    } catch (error: any) {
      console.error("❌ Deletion failed:", error)
      toast.error(error.message || "삭제 중 오류가 발생했습니다.")
    }
  }

  return (
    <div 
      ref={cardRef}
      className={`bg-white/5 rounded-xl p-4 border transition-colors group relative ${
        navigationTarget?.postId === post.id ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/30'
      }`}
    >
      {/* Post Header */}
      <PostHeader
        authorName={authorName}
        avatarUrl={avatarUrl}
        formattedDate={formattedDate}
        isAuthor={isAuthor}
        typeIcon={typeIcon}
        typeLabel={typeLabel}
        onProfileClick={disableProfileClick ? undefined : () => setIsProfileOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Content */}
      <PostContent content={post.content} onTagClick={onTagClick} />

      {/* Image Carousel */}
      <ImageCarousel
        images={images}
        page={page}
        direction={direction}
        currentImageIndex={currentImageIndex}
        hasMultipleImages={hasMultipleImages}
        onPaginate={paginate}
      />

      {/* Actions */}
      <PostActions
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        showComments={showComments}
        onToggleLike={toggleLike}
        onToggleComments={() => setShowComments(!showComments)}
      />

      {/* Comment Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          postAuthorId={post.author_id}
          onCommentCountChange={setCommentCount}
          highlightCommentId={navigationTarget?.postId === post.id ? navigationTarget.commentId : undefined}
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

      {/* User Profile Modal */}
      {!disableProfileClick && (
        <UserProfileModal
          userId={post.author_id}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  )
}
