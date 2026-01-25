export interface Friend {
  id: string
  friendship_id: string
  username: string
  avatar_url: string | null
  status: 'pending' | 'accepted'
  isRequester: boolean
}

export interface ChatRoom {
  id: string
  name: string
  created_by: string
  description?: string | null    
  is_open?: boolean              
  tags?: string[]                
  member_count?: number
  custom_name?: string | null
}
