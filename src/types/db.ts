export interface SearchablePost {
  id: string
  content: string
  category: string
  created_at: string
  author_id: string
  author_username: string | null
  author_avatar_url: string | null
  image_urls: string[] | null
  likes_count: number
  comments_count: number
  city_id: string | null
  search_blob: string | null
}
