import { useState } from "react"
import { Send } from "lucide-react"
import type { ChatInfo } from "@/types/message"

interface MessageInputProps {
  chat: ChatInfo
  anonNickname: string
  onSend: (content: string) => void
}

export default function MessageInput({ chat, anonNickname, onSend }: MessageInputProps) {
  const [inputValue, setInputValue] = useState("")
  const isThemeAmber = chat.type === 'open'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    onSend(inputValue.trim())
    setInputValue("")
  }

  return (
    <div className="p-4 border-t border-white/10 bg-black/40 relative z-20">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={chat.type === 'open' ? `${anonNickname}(으)로 메시지 보내기...` : "Send an encrypted message..."}
          autoFocus
          className={`w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all font-mono text-xs ${
            isThemeAmber ? 'focus:border-amber-500/50' : 'focus:border-indigo-500/50'
          }`}
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-20 transition-all ${
            isThemeAmber ? 'text-amber-500 hover:text-amber-400' : 'text-indigo-400 hover:text-indigo-300'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
