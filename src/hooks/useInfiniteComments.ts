import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 10

export function useInfiniteComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          parent_id,
          author:profiles!author_id (
            id,
            username,
            avatar_url
          )
        `, { count: "exact" })
        .eq("post_id", postId)
        .order("created_at", { ascending: true }) // 댓글은 보통 오래된 순서대로 보여줍니다.
        .range(from, to)

      if (error) throw error

      return {
        comments: data as any[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count || 0
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!postId,
  })
}
