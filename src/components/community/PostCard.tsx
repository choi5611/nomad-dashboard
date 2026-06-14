import { useState, useEffect, useRef, memo } from "react"
import { useAuth } from "@/store/useAuth"
import { useStore } from "@/store/useStore"
import { usePostLike } from "@/hooks/usePostLike"
import { useImageCarousel } from "@/hooks/useImageCarousel"
import { usePostDelete } from "@/hooks/usePostDelete"
import PostHeader from "./PostHeader"
import PostContent from "./PostContent"
import ImageCarousel from "./ImageCarousel"
import PostActions from "./PostActions"
import CommentSection from "./CommentSection"
import ConfirmModal from "../ui/ConfirmModal"
import UserProfileModal from "./UserProfileModal"
import type { LucideIcon } from "lucide-react"

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
  typeIcon: LucideIcon | React.ElementType
  typeLabel: string
  onDelete?: () => void
  onTagClick?: (tag: string) => void
  disableProfileClick?: boolean
}

const PostCard = memo(function PostCard({ 
  post, 
  typeIcon, 
  typeLabel, 
  onDelete, 
  onTagClick, 
  disableProfileClick 
}: PostCardProps) {
  const user = useAuth((state) => state.user)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
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

  // 삭제 훅
  const { 
    isDeleteModalOpen, 
    setIsDeleteModalOpen, 
    handleDelete 
  } = usePostDelete({
    postId: post.id,
    authorId: post.author_id,
    onDelete
  })

  // 알림 네비게이션: 댓글 펼치기는 렌더 단계 조정으로 처리
  const [prevNavTarget, setPrevNavTarget] = useState(navigationTarget)
  if (navigationTarget !== prevNavTarget) {
    setPrevNavTarget(navigationTarget)
    if (navigationTarget?.postId === post.id) {
      setShowComments(true)
    }
  }

  // 스크롤은 side effect이므로 effect에서 처리 (UI 확장 후 스크롤되도록 지연)
  useEffect(() => {
    if (navigationTarget?.postId === post.id) {
      const t = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => clearTimeout(t)
    }
  }, [navigationTarget, post.id])

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
        content={post.content}
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
})

export default PostCard
