import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/types/profile"

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("xp", { ascending: false })
        .limit(100)

      if (error) throw error
      
      // 혹시라도 XP가 없는 레거시 데이터가 있다면 0으로 취급
      return (data || []).map(p => ({
        ...p,
        xp: p.xp || 0
      })) as Profile[]
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시 (랭킹은 실시간일 필요 없음)
  })
}
