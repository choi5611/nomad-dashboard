import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/store/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Send, Reply, Trash2, Loader2, X } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { useQueryClient } from "@tanstack/react-query"
import { useInfiniteComments } from "@/hooks/useInfiniteComments"
import ConfirmModal from "../ui/ConfirmModal"

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  author: {
    id: string
    username: string | null
    avatar_url: string | null
  }
}

interface CommentSectionProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

export default function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const user = useAuth((state) => state.user)
  const queryClient = useQueryClient()
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfiniteComments(postId)
  
  const { ref, inView } = useInView()
  
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("로그인이 필요합니다.")
      return
    }
    if (!content.trim()) return

    setSubmitting(true)
    try {
      const finalParentId = replyTo ? (replyTo.parent_id || replyTo.id) : null

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        parent_id: finalParentId
      })

      if (error) throw error

      setContent("")
      setReplyTo(null)
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      toast.success("댓글이 등록되었습니다.")
    } catch (error) {
      toast.error("댓글 등록 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCommentId) return

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", deletingCommentId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      toast.success("댓글이 삭제되었습니다.")
    } catch (error) {
      toast.error("삭제 실패")
    } finally {
      setDeletingCommentId(null)
    }
  }

  const openDeleteModal = (id: string) => {
    setDeletingCommentId(id)
    setIsDeleteModalOpen(true)
  }

  const handleReplyClick = (comment: Comment) => {
    setReplyTo(comment)
    const displayName = comment.author.username || "사용자"
    const newContent = `@${displayName} `
    setContent(newContent)
    
    // 답글 클릭 시 즉시 포커스 및 커서를 끝으로 이동
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const len = newContent.length
        inputRef.current.setSelectionRange(len, len)
      }
    }, 0)
  }

  // 계층형 구조로 변환 (부모 - 자식)
  const rootComments = allComments.filter(c => !c.parent_id)
  const getReplies = (parentId: string) => allComments.filter(c => c.parent_id === parentId)

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
      {/* 댓글 목록 */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          </div>
        ) : rootComments.length === 0 ? (
          <p className="text-center text-white/30 text-xs py-4">첫 번째 댓글을 남겨보세요!</p>
        ) : (
          <>
            {rootComments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <CommentItem 
                  comment={comment} 
                  currentUserId={user?.id}
                  onReply={() => handleReplyClick(comment)}
                  onDelete={() => openDeleteModal(comment.id)}
                />
                {/* 대댓글 */}
                <div className="pl-8 space-y-2 border-l-2 border-white/5 ml-2">
                  {getReplies(comment.id).map((reply) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      currentUserId={user?.id}
                      onReply={() => handleReplyClick(reply)}
                      onDelete={() => openDeleteModal(reply.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* Sentinel for Infinite Scroll */}
            <div ref={ref} className="h-4 flex justify-center items-center">
              {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-cyan-500/50" />}
            </div>
          </>
        )}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="relative">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-cyan-400 mb-2 bg-cyan-950/30 p-2 rounded-lg">
            <span>@{replyTo.author.username || "사용자"}님에게 답글 작성 중...</span>
            <button type="button" onClick={() => {
              setReplyTo(null)
              setContent("")
            }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={user ? "댓글을 입력하세요..." : "로그인이 필요합니다."}
            disabled={!user || submitting}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!content.trim() || submitting}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="댓글 삭제"
        message="정말로 이 댓글을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  )
}

function CommentItem({ comment, currentUserId, onReply, onDelete }: { 
  comment: Comment, 
  currentUserId?: string,
  onReply: () => void,
  onDelete: () => void
}) {
  const isAuthor = currentUserId === comment.author.id
  const displayName = comment.author.username || "사용자"
  
  // @username 패턴을 찾아서 링크/하이라이트 스타일 적용
  const formatContent = (content: string) => {
    const parts = content.split(/(@[\w.가-힣]+)/) // 한글 닉네임 대응
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-cyan-400 font-medium">{part}</span>
      }
      return part
    })
  }

  return (
    <div className="flex gap-3 group">
      <img 
        src={comment.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`} 
        className="w-8 h-8 rounded-full bg-slate-700 mt-1" 
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{displayName}</span>
          <span className="text-xs text-white/40">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed break-words">
          {formatContent(comment.content)}
        </p>
        
        <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onReply} className="flex items-center gap-1 text-xs text-white/40 hover:text-cyan-400">
            <Reply className="w-3 h-3" /> 답글
          </button>
          {isAuthor && (
            <button type="button" onClick={onDelete} className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400">
              <Trash2 className="w-3 h-3" /> 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// XIcon 함수 제거 (Lucide X 사용 권장)

