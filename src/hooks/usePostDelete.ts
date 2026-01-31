import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/store/useAuth"
import { toast } from "sonner"

interface UsePostDeleteProps {
  postId: string
  authorId: string
  onDelete?: () => void
}

export function usePostDelete({ postId, authorId, onDelete }: UsePostDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const user = useAuth((state) => state.user)

  const handleDelete = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.")
      return
    }

    if (user.id !== authorId) {
      toast.error("삭제 권한이 없습니다.")
      return
    }

    try {
      setIsDeleting(true)
      console.log(`🚀 Attempting to delete post: ${postId} (Current User: ${user.id})`)

      // 1. 본문 삭제 (작성자 ID를 조건에 추가하여 RLS 권한을 한 번 더 보증)
      const { error, count } = await supabase
        .from("posts")
        .delete({ count: 'exact' })
        .eq("id", postId)
        .eq("author_id", user.id)

      if (error) throw error

      if (count === 0) {
        console.warn("⚠️ No rows deleted. Potential reasons: Already deleted or permission denied.")
        throw new Error("삭제할 수 없는 게시글이거나 권한이 없습니다.")
      }

      console.log("✅ Database confirmed deletion.")

      // 2. XP 환수 (-10 XP) - 어뷰징 방지
      // 이 부분은 실패해도 게시글 삭제 자체를 되돌리진 않음 (선택적)
      try {
        await supabase.rpc('increment_xp', { user_id: user.id, amount: -10 })
        useAuth.getState().fetchProfile(user.id)
      } catch (xpError) {
        console.warn("XP decrement failed:", xpError)
      }

      toast.success("게시글이 삭제되었습니다.")
      setIsDeleteModalOpen(false)

      // 3. UI 갱신 (콜백 호출)
      if (onDelete) {
        onDelete()
      }

    } catch (error: any) {
      console.error("❌ Deletion failed:", error)
      toast.error(error.message || "삭제 중 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isDeleting,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleDelete
  }
}
