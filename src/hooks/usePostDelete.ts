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


      // 2. XP 환수(-10)는 posts DELETE 트리거(reclaim_xp_on_post_delete)가 서버에서 처리.
      // UI 갱신 실패는 게시글 삭제를 되돌리지 않음 (다음 로드 시 반영)
      try {
        await useAuth.getState().fetchProfile(user.id)
      } catch (xpError) {
        console.warn("Profile refresh after delete failed:", xpError)
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
