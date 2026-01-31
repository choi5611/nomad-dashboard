import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { sanitizeSearchQuery, sanitizeHashtag } from "@/utils/sanitize"
import type { SearchablePost } from "@/types/db"

interface UseInfinitePostsProps {
  category: string
  cityId?: string
  hashtag?: string | null
  searchQuery?: string
  authorId?: string
  likedByUserId?: string
}

const POSTS_PER_PAGE = 10

export function useInfinitePosts({ 
  category, 
  cityId, 
  hashtag, 
  searchQuery, 
  authorId, 
  likedByUserId 
}: UseInfinitePostsProps) {
  return useInfiniteQuery({
    queryKey: ["posts", category, cityId, hashtag, searchQuery, authorId, likedByUserId],
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
        const sanitizedHashtag = sanitizeHashtag(hashtag)
        query = query.ilike("search_blob", `%#${sanitizedHashtag}%`)
      }

      if (authorId) {
        query = query.eq("author_id", authorId)
      }

      if (likedByUserId) {
        // 특정 유저가 좋아요한 글을 가져오기 위한 서브쿼리 필터
        const { data: likedPostIds } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", likedByUserId)
        
        const ids = likedPostIds?.map(l => l.post_id) || []
        query = query.in("id", ids)
      }

      if (searchQuery) {
        const sanitizedQuery = sanitizeSearchQuery(searchQuery)
        const terms = sanitizedQuery.trim().split(/\s+/)
        terms.forEach(term => {
          if (term) {
            // 게시글 본문 + 모든 댓글 + 작성자명이 합쳐진 'search_blob'에서 검색!
            query = query.ilike("search_blob", `%${term}%`)
          }
        })
      }

      // 제네릭을 사용하여 반환 타입을 명시하거나, returns() 메서드를 사용할 수 있습니다.
      // 여기서는 data를 SearchablePost[]로 캐스팅하여 안정성을 확보합니다.
      const { data, error } = await query.returns<SearchablePost[]>()

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
