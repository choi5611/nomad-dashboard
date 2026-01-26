import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
  fetchProfile: (userId: string, silent?: boolean) => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null
    })
    if (session?.user) {
      // 세션이 설정될 때 프로필도 가져옵니다.
      useAuth.getState().fetchProfile(session.user.id)
    } else {
      set({ profile: null, loading: false })
    }
  },

  fetchProfile: async (userId, silent = false) => {
    if (!silent) set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // .single() 대신 .maybeSingle()을 사용하여 데이터가 없어도 에러를 내지 않습니다.

      if (error && error.code !== 'PGRST116') throw error
      set({ profile: data || null, loading: false })
    } catch (error) {
      console.error('Error fetching profile:', error)
      set({ loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  }
}))
