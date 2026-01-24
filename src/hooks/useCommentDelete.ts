import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export function useCommentDelete(postId: string) {
  const queryClient = useQueryClient()
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

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
    } catch {
      toast.error("삭제 실패")
    } finally {
      setDeletingCommentId(null)
      setIsDeleteModalOpen(false)
    }
  }

  const openDeleteModal = (id: string) => {
    setDeletingCommentId(id)
    setIsDeleteModalOpen(true)
  }

  return {
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleDelete,
    openDeleteModal
  }
}
