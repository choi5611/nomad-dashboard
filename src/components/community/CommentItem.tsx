import { Reply, Trash2 } from "lucide-react"
import type { Comment } from "@/types/comment"

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  onReply: () => void
  onDelete: () => void
  onAvatarClick: () => void
}

export default function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onAvatarClick
}: CommentItemProps) {
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
    <div className="flex gap-3 group">
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
        <p className="text-sm text-white/80 leading-relaxed break-words">
          {formatContent(comment.content)}
        </p>

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
