import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

interface UseInfinitePostsProps {
  category: string
  cityId?: string
  hashtag?: string | null
  searchQuery?: string
}

const POSTS_PER_PAGE = 10

export function useInfinitePosts({ category, cityId, hashtag, searchQuery }: UseInfinitePostsProps) {
  return useInfiniteQuery({
    queryKey: ["posts", category, cityId, hashtag, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      // 일반 posts 테이블 대신, 댓글까지 합쳐진 searchable_posts 뷰를 조회합니다.
      let query = supabase
        .from("searchable_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1)

      if (cityId) {
        query = query.eq("city_id", cityId.toLowerCase())
      }

      if (category !== "all") {
        query = query.eq("category", category)
      }

      if (hashtag) {
        // 이미 search_blob에 해시태그가 포함되어 있으므로 동일하게 검색 가능
        query = query.ilike("search_blob", `%#${hashtag}%`)
      }

      if (searchQuery) {
        const terms = searchQuery.trim().split(/\s+/)
        terms.forEach(term => {
          if (term) {
            // 게시글 본문 + 모든 댓글 + 작성자명이 합쳐진 'search_blob'에서 검색!
            query = query.ilike("search_blob", `%${term}%`)
          }
        })
      }

      const { data, error } = await query

      if (error) throw error

      // 뷰의 데이터를 기존 PostCard가 기대하는 구조로 변환해줍니다.
      return (data || []).map((post) => ({
        ...post,
        profiles: {
          username: post.author_username,
          avatar_url: post.author_avatar_url
        }
        // likes_count, comments_count는 뷰에서 이미 숫자로 제공됨
      }))
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // 만약 마지막 페이지 데이터가 POSTS_PER_PAGE보다 적으면 더 이상 데이터가 없는 것
      return lastPage.length === POSTS_PER_PAGE ? allPages.length : undefined
    },
  })
}
