import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Save, Loader2, LogOut } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export default function SettingsSidebar() {
  const { isSettingsOpen, closeSettings } = useStore()
  const { profile, fetchProfile, user, signOut } = useAuth()
  const queryClient = useQueryClient()
  
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("로그아웃되었습니다.")
      closeSettings()
    } catch (error) {
      toast.error("로그아웃 실패")
    }
  }

  // 프로필 정보가 바뀔 때마다 입력창 초기화
  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username)
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!username.trim()) {
      toast.error("닉네임을 입력해주세요.")
      return
    }

    setLoading(true)
    try {
      // 1. 30일 제한 체크 (마지막 변경일로부터 30일이 지났는지)
      if (profile?.username_updated_at) {
        const lastUpdate = new Date(profile.username_updated_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - lastUpdate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays < 30) {
          toast.error(`닉네임은 30일에 한 번만 변경할 수 있습니다. (${30 - diffDays}일 남음)`)
          setLoading(false)
          return
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
        // 중복 프로필(UNIQUE 제약 조건 위반) 에러 처리
        if (error.code === "23505") {
          toast.error("이미 사용 중인 닉네임입니다.")
          return
        }
        throw error
      }

      await fetchProfile(user.id) // 최신 정보로 갱신
      
      // 캐시 무효화 (게시글/댓글의 작성자 정보를 최신으로 갱신)
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      
      toast.success("프로필이 업데이트되었습니다.")
      closeSettings()
    } catch (error: any) {
      toast.error("업데이트 실패: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSettings}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-sm bg-slate-900 border-l border-white/10 z-[90] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <User className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">사용자 설정</h2>
              </div>
              <button
                onClick={closeSettings}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {/* Profile Image Preview */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-cyan-500/20 shadow-xl"
                  />
                </div>
                <p className="mt-4 text-sm text-white/40">{user?.email}</p>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60 ml-1">닉네임</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="새로운 닉네임"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading || username === profile?.username}
                    className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        설정 저장하기
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-4 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-white/40 hover:text-red-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    로그아웃
                  </button>
                </div>
              </form>
            </div>

            {/* FooterInfo */}
            <div className="p-6 border-t border-white/5 text-center">
              <p className="text-xs text-white/20">
                닉네임을 변경하면 작성하신 모든 게시글과 댓글에 즉시 반영됩니다.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
