import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

interface UseInfinitePostsProps {
  category: string
  cityId?: string
  hashtag?: string | null
}

const POSTS_PER_PAGE = 10

export function useInfinitePosts({ category, cityId, hashtag }: UseInfinitePostsProps) {
  return useInfiniteQuery({
    queryKey: ["posts", category, cityId, hashtag],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("posts")
        .select(`
          *, 
          profiles(username, avatar_url),
          likes(count),
          comments(count)
        `)
        .order("created_at", { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1)

      if (cityId) {
        query = query.eq("city_id", cityId.toLowerCase())
      }

      if (category !== "all") {
        query = query.eq("category", category)
      }

      if (hashtag) {
        query = query.ilike("content", `%#${hashtag}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform counts
      return (data || []).map((post) => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: post.comments?.[0]?.count || 0,
      }))
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // 만약 마지막 페이지 데이터가 POSTS_PER_PAGE보다 적으면 더 이상 데이터가 없는 것
      return lastPage.length === POSTS_PER_PAGE ? allPages.length : undefined
    },
  })
}
