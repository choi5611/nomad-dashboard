import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Save, Loader2, LogOut } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import Cropper from "react-easy-crop"
import { getCroppedImg } from "@/utils/cropImage"
import { v4 as uuidv4 } from "uuid"
import { Camera } from "lucide-react"
import { getNomadRank } from "@/utils/rankUtils"
import MyActivityList from "@/components/community/MyActivityList"
import MedalCollection from "./MedalCollection"
import { Award } from "lucide-react"


export default function SettingsSidebar() {
  const { isSettingsOpen, closeSettings } = useStore()
  const { profile, fetchProfile, user, signOut } = useAuth()
  const queryClient = useQueryClient()
  
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Cropping state
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

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

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const imageDataUrl = URL.createObjectURL(file)
      setImageSrc(imageDataUrl)
    }
  }

  const handleAvatarUpload = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return

    setUploading(true)
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (!croppedImageBlob) throw new Error("이미지 크롭 실패")

      const fileName = `${user.id}/${uuidv4()}.jpg`
      const filePath = fileName

      // 1. Storage 업로드 (avatars 버킷 사용)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImageBlob, {
          contentType: "image/jpeg",
          upsert: true,
        })

      if (uploadError) throw uploadError

      // 2. Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      // 3. Profiles 테이블 업데이트
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateError) throw updateError

      await fetchProfile(user.id)
      
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["comments"] })

      toast.success("프로필 이미지가 변경되었습니다.")
      setImageSrc(null) // 크롭 모달 닫기
    } catch (error: any) {
      console.error(error)
      toast.error("이미지 업로드 실패: " + error.message)
    } finally {
      setUploading(false)
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
                  <div className="w-24 h-24 rounded-full border-4 border-cyan-500/20 shadow-xl overflow-hidden relative">
                    <img
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    <label 
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      htmlFor="avatar-upload"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </label>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>
                <p className="mt-4 text-sm text-white/40">{user?.email}</p>
                
                {/* Nomad Rank Badge */}
                {(() => {
                  const rank = getNomadRank(profile?.xp || 0)
                  const Icon = rank.icon
                  const progress = Math.min(100, ((profile?.xp || 0) / rank.nextLevelXp) * 100)
                  
                  return (
                    <div className="mt-6 w-full bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group/rank">
                      {/* Background Glow */}
                      <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 transition-colors ${rank.color.replace('text-', 'bg-')}`} />
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-black/40 border border-white/5 ${rank.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Nomad Standing</p>
                          <p className={`text-sm font-bold tracking-tight ${rank.color}`}>{rank.name}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] uppercase font-mono tracking-tighter">
                          <span className="text-white/40">Knowledge (XP)</span>
                          <span className="text-white/60">{profile?.xp || 0} / {rank.nextLevelXp === 99999 ? 'MAX' : rank.nextLevelXp}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full opacity-80 ${rank.color.replace('text-', 'bg-')}`} 
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Visit Medals Collection */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] opacity-60">Certified Medals</h3>
                  </div>
                  <MedalCollection />
                </div>
              </div>

              {/* Cropper Modal Overlay */}
              {imageSrc && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
                  <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl overflow-hidden">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape="round"
                      showGrid={false}
                    />
                  </div>
                  
                  <div className="mt-8 w-full max-w-md space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/40 px-1">
                            <span>확대/축소</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setImageSrc(null)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleAvatarUpload}
                        disabled={uploading}
                        className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "적용하기"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Personal Hub (Activity) */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Personal Hub</h3>
                </div>
                <MyActivityList />
              </div>
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
