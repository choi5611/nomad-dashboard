import { Send, Loader2, X } from "lucide-react"
import type { Comment } from "@/types/comment"

interface CommentInputProps {
  content: string
  setContent: (content: string) => void
  submitting: boolean
  replyTo: Comment | null
  onSubmit: (e: React.FormEvent) => void
  onCancelReply: () => void
  inputRef: React.RefObject<HTMLInputElement>
  user: any
}

export default function CommentInput({
  content,
  setContent,
  submitting,
  replyTo,
  onSubmit,
  onCancelReply,
  inputRef,
  user
}: CommentInputProps) {
  return (
    <form onSubmit={onSubmit} className="relative">
      {replyTo && (
        <div className="flex items-center justify-between text-xs text-cyan-400 mb-2 bg-cyan-950/30 p-2 rounded-lg">
          <span>@{replyTo.author.username || "사용자"}님에게 답글 작성 중...</span>
          <button type="button" onClick={onCancelReply}>
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
  )
}
