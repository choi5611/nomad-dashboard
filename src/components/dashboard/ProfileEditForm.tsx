import { Save, Loader2, LogOut } from "lucide-react"

interface ProfileEditFormProps {
  username: string
  currentUsername: string | undefined
  loading: boolean
  onUsernameChange: (value: string) => void
  onSubmit: () => void
  onSignOut: () => void
}

export default function ProfileEditForm({
  username,
  currentUsername,
  loading,
  onUsernameChange,
  onSubmit,
  onSignOut
}: ProfileEditFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/60 ml-1">닉네임</label>
        <input
          type="text"
          maxLength={15}
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="새로운 닉네임 (2~15자, 한글/영문/숫자/_)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
        />
      </div>

      <div className="pt-2 space-y-3">
        <button
          type="submit"
          disabled={loading || username === currentUsername}
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
          onClick={onSignOut}
          className="w-full py-4 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-white/40 hover:text-red-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </form>
  )
}
