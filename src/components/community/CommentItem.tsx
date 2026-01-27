import { useEffect, useRef } from "react"
import { Reply, Trash2 } from "lucide-react"
import type { Comment } from "@/types/comment"

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  onReply: () => void
  onDelete: () => void
  onAvatarClick: () => void
  isHighlighted?: boolean
}

export default function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onAvatarClick,
  isHighlighted
}: CommentItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isHighlighted) {
      // 약간의 지연 후 스크롤 (부모 컴포넌트 확장 완료 대기)
      const timer = setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isHighlighted])

  const isAuthor = currentUserId === comment.author.id
  const displayName = comment.author.username || "사용자"

  // @username 및 #hashtag 패턴을 모두 찾아 하이라이트 적용
  const formatContent = (content: string) => {
    // @멘션과 #해시태그를 모두 캡처하는 정규식
    const parts = content.split(/(@[\w.가-힣]+|#[^\s#]+)/)
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-cyan-400 font-medium">{part}</span>
      }
      if (part.startsWith("#")) {
        return <span key={i} className="text-cyan-400 hover:underline cursor-pointer">{part}</span>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div 
      ref={itemRef}
      className={`flex gap-3 group p-2 rounded-lg transition-all duration-500 ${
        isHighlighted ? 'bg-cyan-500/10 ring-1 ring-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : ''
      }`}
    >
      <img
        src={comment.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
        className="w-8 h-8 rounded-full bg-slate-700 mt-1 cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-all"
        onClick={onAvatarClick}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-sm font-medium text-white cursor-pointer hover:text-cyan-400 transition-colors"
            onClick={onAvatarClick}
          >
            {displayName}
          </span>
          <span className="text-xs text-white/40">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <div className="text-sm text-white/80 leading-relaxed break-words">
          {formatContent(comment.content)}
        </div>

        <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onReply} className="flex items-center gap-1 text-xs text-white/40 hover:text-cyan-400">
            <Reply className="w-3 h-3" /> <span>답글</span>
          </button>
          {isAuthor && (
            <button type="button" onClick={onDelete} className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400">
              <Trash2 className="w-3 h-3" /> <span>삭제</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
