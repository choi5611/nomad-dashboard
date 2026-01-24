import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/profile"

export function useProfileUpdate(user: User | null, profile: Profile | null, fetchProfile: (userId: string) => Promise<void>) {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username)
    }
  }, [profile])

  const handleUpdateProfile = async () => {
    if (!user) return false
    if (!username.trim()) {
      toast.error("닉네임을 입력해주세요.")
      return false
    }

    setLoading(true)
    try {
      // 30일 제한 체크
      if (profile?.username_updated_at) {
        const lastUpdate = new Date(profile.username_updated_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - lastUpdate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 30) {
          toast.error(`닉네임은 30일에 한 번만 변경할 수 있습니다. (${30 - diffDays}일 남음)`)
          setLoading(false)
          return false
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          username_updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) {
        if (error.code === "23505") {
          toast.error("이미 사용 중인 닉네임입니다.")
          return false
        }
        throw error
      }

      await fetchProfile(user.id)

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["comments"] })

      toast.success("프로필이 업데이트되었습니다.")
      return true
    } catch (error: any) {
      toast.error("업데이트 실패: " + error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    username,
    setUsername,
    loading,
    handleUpdateProfile
  }
}
