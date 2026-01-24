import { Loader2 } from "lucide-react"
import CommentItem from "./CommentItem"
import type { Comment } from "@/types/comment"

interface CommentListProps {
  comments: Comment[]
  isLoading: boolean
  currentUserId?: string
  onReply: (comment: Comment) => void
  onDelete: (commentId: string) => void
  onAvatarClick: (userId: string) => void
  sentinelRef: (node?: Element | null) => void
  isFetchingNextPage: boolean
}

export default function CommentList({
  comments,
  isLoading,
  currentUserId,
  onReply,
  onDelete,
  onAvatarClick,
  sentinelRef,
  isFetchingNextPage
}: CommentListProps) {
  // 계층형 구조로 변환 (부모 - 자식)
  const rootComments = comments.filter(c => !c.parent_id)
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (rootComments.length === 0) {
    return (
      <p className="text-center text-white/30 text-xs py-4">첫 번째 댓글을 남겨보세요!</p>
    )
  }

  return (
    <>
      {rootComments.map((comment) => (
        <div key={comment.id} className="space-y-2">
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onReply={() => onReply(comment)}
            onDelete={() => onDelete(comment.id)}
            onAvatarClick={() => onAvatarClick(comment.author.id)}
          />
          {/* 대댓글 */}
          <div className="pl-8 space-y-2 border-l-2 border-white/5 ml-2">
            {getReplies(comment.id).map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onReply={() => onReply(reply)}
                onDelete={() => onDelete(reply.id)}
                onAvatarClick={() => onAvatarClick(reply.author.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Sentinel for Infinite Scroll */}
      <div ref={sentinelRef} className="h-4 flex justify-center items-center">
        {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-cyan-500/50" />}
      </div>
    </>
  )
}
