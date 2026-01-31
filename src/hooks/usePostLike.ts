import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"

export function usePostLike(postId: string, postAuthorId: string, user: User | null, initialCount: number) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialCount)

  useEffect(() => {
    if (user) {
      checkIfLiked()
    }
  }, [user, postId])

  useEffect(() => {
    setLikeCount(initialCount)
  }, [initialCount])

  const checkIfLiked = async () => {
    if (!user) return
    const { data } = await supabase
      .from("likes")
      .select("user_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    setIsLiked(!!data)
  }

  const toggleLike = useCallback(async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.")
      return
    }

    // Optimistic Update
    const prevIsLiked = isLiked
    const prevCount = likeCount

    setIsLiked(!prevIsLiked)
    setLikeCount(prev => prevIsLiked ? prev - 1 : prev + 1)

    try {
      if (prevIsLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id })
        if (error) throw error

        // 작성자에게 XP 보상 - 내가 내 글에 누른 게 아닐 때만
        if (postAuthorId !== user.id) {
          await supabase.rpc('increment_xp', { user_id: postAuthorId, amount: 2 })

          // 알림 보내기
          await supabase.from("notifications").insert({
            receiver_id: postAuthorId,
            sender_id: user.id,
            type: "like",
            post_id: postId
          })
        }
      }
    } catch {
      // Revert on error
      setIsLiked(prevIsLiked)
      setLikeCount(prevCount)
      toast.error("좋아요 처리 중 오류가 발생했습니다.")
    }
  }, [user, isLiked, likeCount, postId, postAuthorId])

  return {
    isLiked,
    likeCount,
    toggleLike
  }
}
