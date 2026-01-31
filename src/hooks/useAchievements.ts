import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { BADGES } from "@/constants/badges"

export function useAchievements() {
  const unlockBadge = async (userId: string, badgeId: string) => {
    try {
      // 1. 현재 뱃지 목록 가져오기
      const { data: profile } = await supabase
        .from("profiles")
        .select("badges")
        .eq("id", userId)
        .single()

      if (!profile) return

      const currentBadges = (profile.badges as string[]) || []

      // 2. 이미 획득했는지 체크
      if (currentBadges.includes(badgeId)) return

      // 3. 업데이트
      const newBadges = [...currentBadges, badgeId]
      const { error } = await supabase
        .from("profiles")
        .update({ badges: newBadges })
        .eq("id", userId)

      if (error) throw error

      // 4. 축하 알림 (Toast)
      const badge = Object.values(BADGES).find(b => b.id === badgeId)
      if (badge) {
        toast.success(`🎉 뱃지 획득: ${badge.name}`, {
           description: badge.description,
           duration: 5000,
           className: "bg-zinc-900 border-yellow-500/50 text-white"
        })
      }

    } catch (err) {
      console.error("Failed to unlock badge:", err)
    }
  }

  const checkFirstPost = async (userId: string) => {
    // 게시글 수 확인 (이 함수가 호출된 시점은 이미 글이 작성된 직후라 가정)
    const { count } = await supabase
      .from("posts")
      .select("*", { count: 'exact', head: true })
      .eq("author_id", userId)

    if (count === 1) {
      await unlockBadge(userId, BADGES.FIRST_STEP.id)
    }
  }

  return {
    unlockBadge,
    checkFirstPost
  }
}
