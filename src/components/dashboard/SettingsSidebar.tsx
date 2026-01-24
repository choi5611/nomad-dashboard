import { motion, AnimatePresence } from "framer-motion"
import { X, User, Loader2 } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import { toast } from "sonner"
import { useProfileUpdate } from "@/hooks/useProfileUpdate"
import { useAvatarCrop } from "@/hooks/useAvatarCrop"
import ProfileImageSection from "./ProfileImageSection"
import AvatarCropModal from "./AvatarCropModal"
import ProfileEditForm from "./ProfileEditForm"
import MyActivityList from "@/components/community/MyActivityList"

export default function SettingsSidebar() {
  const { isSettingsOpen, closeSettings } = useStore()
  const { profile, fetchProfile, user, signOut, loading: authLoading } = useAuth()

  // 프로필 업데이트 훅
  const { username, setUsername, loading, handleUpdateProfile } = useProfileUpdate(
    user,
    profile,
    fetchProfile
  )

  // 아바타 크롭 훅
  const {
    imageSrc,
    setImageSrc,
    crop,
    setCrop,
    zoom,
    setZoom,
    uploading,
    handleFileChange,
    onCropComplete,
    handleAvatarUpload
  } = useAvatarCrop(user, fetchProfile)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("로그아웃되었습니다.")
      closeSettings()
    } catch (error) {
      toast.error("로그아웃 실패")
    }
  }

  const handleProfileSubmit = async () => {
    const success = await handleUpdateProfile()
    if (success) {
      closeSettings()
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
              {/* Loading State */}
              {authLoading || (user && !profile) ? (
                <div className="flex-1 flex items-center justify-center min-h-[200px]">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <>
                  {/* Profile Image Section */}
                  <ProfileImageSection
                    email={user?.email}
                    avatarUrl={profile?.avatar_url || ''}
                    userId={user?.id || ''}
                    xp={profile?.xp || 0}
                    onFileChange={handleFileChange}
                    uploading={uploading}
                  />

                  {/* Cropper Modal */}
                  {imageSrc && (
                    <AvatarCropModal
                      imageSrc={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      uploading={uploading}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      onCancel={() => setImageSrc(null)}
                      onConfirm={handleAvatarUpload}
                    />
                  )}

                  {/* Edit Form */}
                  <ProfileEditForm
                    username={username}
                    currentUsername={profile?.username}
                    loading={loading}
                    onUsernameChange={setUsername}
                    onSubmit={handleProfileSubmit}
                    onSignOut={handleSignOut}
                  />

                  {/* Personal Hub (Activity) */}
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Personal Hub</h3>
                    </div>
                    <MyActivityList />
                  </div>
                </>
              )}
            </div>

            {/* Footer Info */}
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
