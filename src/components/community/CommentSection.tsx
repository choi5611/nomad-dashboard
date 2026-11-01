import { useState, useEffect } from "react"
import { useAuth } from "@/store/useAuth"
import { useInView } from "react-intersection-observer"
import { useInfiniteComments } from "@/hooks/useInfiniteComments"
import { useCommentSubmit } from "@/hooks/useCommentSubmit"
import { useCommentDelete } from "@/hooks/useCommentDelete"
import { useReplyState } from "@/hooks/useReplyState"
import CommentList from "./CommentList"
import CommentInput from "./CommentInput"
import ConfirmModal from "../ui/ConfirmModal"
import UserProfileModal from "./UserProfileModal"

interface CommentSectionProps {
  postId: string
  onCommentCountChange?: (count: number) => void
  highlightCommentId?: string
}

export default function CommentSection({ postId, onCommentCountChange, highlightCommentId }: CommentSectionProps) {
  const user = useAuth((state) => state.user)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteComments(postId)

  const { ref, inView } = useInView()

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const { content, setContent, submitting, handleSubmit } = useCommentSubmit(postId)
  const { isDeleteModalOpen, setIsDeleteModalOpen, handleDelete, openDeleteModal } = useCommentDelete(postId)
  const { replyTo, inputRef, handleReplyClick, clearReply } = useReplyState()

  // 마운트 시 자동 포커스
  useEffect(() => {
    if (user) {
      inputRef.current?.focus()
    }
  }, [user])

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage])

  const allComments = data?.pages.flatMap(page => page.comments) || []
  const totalCount = data?.pages[0]?.totalCount || 0

  useEffect(() => {
    if (onCommentCountChange) onCommentCountChange(totalCount)
  }, [totalCount, onCommentCountChange])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(replyTo, clearReply)
  }

  const onCancelReply = () => {
    clearReply()
    setContent("")
  }

  const openProfile = (id: string) => {
    setSelectedUserId(id)
    setIsProfileOpen(true)
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
      {/* 댓글 목록 */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
        <CommentList
          comments={allComments}
          isLoading={isLoading}
          currentUserId={user?.id}
          onReply={(comment) => handleReplyClick(comment, setContent)}
          onDelete={openDeleteModal}
          onAvatarClick={openProfile}
          sentinelRef={ref}
          isFetchingNextPage={isFetchingNextPage}
          highlightCommentId={highlightCommentId}
        />
      </div>

      {/* 입력 폼 */}
      <CommentInput
        content={content}
        setContent={setContent}
        submitting={submitting}
        replyTo={replyTo}
        onSubmit={onSubmit}
        onCancelReply={onCancelReply}
        inputRef={inputRef}
        user={user}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="댓글 삭제"
        message="정말로 이 댓글을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  )
}

