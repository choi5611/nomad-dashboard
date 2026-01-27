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

      const { data: newComment, error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        parent_id: finalParentId
      }).select('id').single()

      if (error) throw error

      // XP 보상 (+5 XP)
      await supabase.rpc('increment_xp', { user_id: user.id, amount: 5 })
      useAuth.getState().fetchProfile(user.id)

      // 알림 로직
      const notifications = []
      const notifiedUserIds = new Set<string>([user.id]) // 본인 제외

      // 1. 답글 알림 (reply)
      if (replyTo && replyTo.author?.id && replyTo.author.id !== user.id) {
        notifications.push({
          receiver_id: replyTo.author.id,
          sender_id: user.id,
          type: "reply",
          post_id: postId,
          comment_id: newComment.id
        })
        notifiedUserIds.add(replyTo.author.id)
      }

      // 2. 언급 알림 (mention)
      const mentionRegex = /@([\w.가-힣]+)/g
      const mentions = [...content.matchAll(mentionRegex)].map(match => match[1])
      if (mentions.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('username', mentions)
        
        if (profiles) {
          profiles.forEach(p => {
            if (!notifiedUserIds.has(p.id)) {
              notifications.push({
                receiver_id: p.id,
                sender_id: user.id,
                type: "mention",
                post_id: postId,
                comment_id: newComment.id
              })
              notifiedUserIds.add(p.id)
            }
          })
        }
      }

      // 3. 포스트 작성자 알림 (comment) - 이미 답글이나 언급으로 알림이 가지 않았을 때만
      if (postAuthorId !== user.id && !notifiedUserIds.has(postAuthorId)) {
        notifications.push({
          receiver_id: postAuthorId,
          sender_id: user.id,
          type: "comment",
          post_id: postId,
          comment_id: newComment.id
        })
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications)
      }

      setContent("")
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      toast.success("댓글이 등록되었습니다.")

      if (onSuccess) onSuccess()
    } catch (e) {
      console.error("Error submitting comment:", e)
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
