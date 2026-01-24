import { useState, useRef } from "react"
import type { Comment } from "@/types/comment"

export function useReplyState() {
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 답글 클릭 시 포커스 및 멘션 추가
  const handleReplyClick = (comment: Comment, setContent: (content: string) => void) => {
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

  const clearReply = () => {
    setReplyTo(null)
  }

  return {
    replyTo,
    setReplyTo,
    inputRef,
    handleReplyClick,
    clearReply
  }
}
