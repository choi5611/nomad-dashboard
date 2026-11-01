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
    const prevUser = useAuth.getState().user
    // 토큰 갱신(약 1시간마다)에도 같은 유저면 user 객체를 유지 → [user] 의존 effect(실시간 구독)가 재실행되지 않음
    // shortcut: 같은 id면 이전 user 객체를 쓰므로 USER_UPDATED(이메일 변경 등)는 새로고침 후 반영
    const sameUser = !!session?.user && prevUser?.id === session.user.id
    set({
      session,
      user: sameUser ? prevUser : session?.user ?? null
    })
    if (session?.user) {
      // 새 유저일 때만 프로필을 가져옵니다.
      if (!sameUser) useAuth.getState().fetchProfile(session.user.id)
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
