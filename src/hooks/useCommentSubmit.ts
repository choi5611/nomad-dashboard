import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/store/useAuth"
import { useQueryClient } from "@tanstack/react-query"
import type { Comment } from "@/types/comment"

export function useCommentSubmit(postId: string, postAuthorId: string) {
  const user = useAuth((state) => state.user)
  const queryClient = useQueryClient()
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (replyTo: Comment | null, onSuccess?: () => void) => {
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

      // XP 보상 (+5 XP)
      await supabase.rpc('increment_xp', { user_id: user.id, amount: 5 })
      useAuth.getState().fetchProfile(user.id)

      // 알림 보내기 (내가 내 글에 댓글 단 게 아닐 때만)
      if (postAuthorId !== user.id) {
        await supabase.from("notifications").insert({
          receiver_id: postAuthorId,
          sender_id: user.id,
          type: "comment",
          post_id: postId
        })
      }

      setContent("")
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      toast.success("댓글이 등록되었습니다.")

      if (onSuccess) onSuccess()
    } catch {
      toast.error("댓글 등록 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return {
    content,
    setContent,
    submitting,
    handleSubmit
  }
}
