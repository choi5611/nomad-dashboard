/**
 * 사용자 프로필 타입 정의
 */

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  country_code: string
  xp: number
  username_updated_at: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 게시물/댓글 작성자 프로필 (간소화 버전)
 */
export interface AuthorProfile {
  username: string
  avatar_url: string | null
  country_code?: string
}
