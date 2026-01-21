import { useState } from "react"
import { X, Github, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type Provider = 'github' | 'google'

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  if (!isOpen) return null

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert("확인 이메일을 보냈습니다! 메일함을 확인해주세요.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onClose()
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? "계정 만들기" : "다시 오셨군요!"}
          </h2>
          <p className="text-white/50">
            {isSignUp ? "노마드 커뮤니티의 일원이 되어보세요." : "로그인하고 경험을 공유하세요."}
          </p>
        </div>

        <div className="space-y-3">
          {/* 소셜 로그인 버튼 */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="flex items-center justify-center gap-3 py-3 bg-white hover:bg-white/90 border border-white/10 rounded-xl text-black font-semibold transition-all shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google로 시작하기
            </button>
            <button 
              onClick={() => handleOAuthLogin('github')}
              className="flex items-center justify-center gap-3 py-3 bg-[#24292e] hover:bg-[#2c3238] border border-white/10 rounded-xl text-white font-semibold transition-all shadow-lg"
            >
              <Github className="w-5 h-5" />
              GitHub으로 시작하기
            </button>
          </div>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-white/30 font-medium">또는 이메일로 계속하기</span>
            </div>
          </div>

          {/* 이메일 로그인 */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pl-11 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                  required
                />
              </div>
              <input 
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 text-sm"
            >
              {loading ? "처리 중..." : (isSignUp ? "가입하기" : "로그인")}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            {isSignUp ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {isSignUp ? "로그인하기" : "회원가입하기"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
