import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/types/profile"

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return []

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${query}%`)
        .limit(20)

      if (error) throw error
      return (data || []) as Profile[]
    },
    enabled: query.length >= 2,
  })
}
