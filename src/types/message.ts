export interface DMMessage {
  id: string
  sender_id?: string  // DM
  user_id?: string    // Group
  receiver_id?: string
  room_id?: string
  content: string
  is_anonymous?: boolean
  nickname?: string
  created_at: string
  // Joined fields
  sender?: {
    username: string
    avatar_url: string | null
    country_code?: string
  }
  profiles?: {
    username: string
    avatar_url: string | null
    country_code?: string
  }
}

export interface ChatInfo {
  type: 'dm' | 'group' | 'open'
  id: string
  name: string
  avatar_url?: string
}
