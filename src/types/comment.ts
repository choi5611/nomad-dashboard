export interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  author: {
    id: string
    username: string | null
    avatar_url: string | null
  }
}
