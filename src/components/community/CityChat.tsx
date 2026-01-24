import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import CityMessageItem from "./CityMessageItem"
import type { CityMessage } from "@/types/city-chat"

interface CityChatProps {
  cityName: string
  messages: CityMessage[]
  onlineCount: number
  userId: string | undefined
  onSendMessage: (content: string) => void
  onProfileClick: (userId: string) => void
  disabled: boolean
}

export default function CityChat({
  cityName,
  messages,
  onlineCount,
  userId,
  onSendMessage,
  onProfileClick,
  disabled
}: CityChatProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // 새 메시지 오면 스크롤 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    onSendMessage(inputValue.trim())
    setInputValue("")
  }

  return (
    <>
      <div className="px-4 py-2 border-b border-white/5 bg-white/5">
        <p className="text-[10px] text-cyan-400 font-mono tracking-tighter uppercase">
          Secure Link to {cityName} Terminal • {onlineCount} Active Nomads
        </p>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <CityMessageItem
            key={msg.id || idx}
            message={msg}
            isOwn={msg.author_id === userId}
            onProfileClick={() => onProfileClick(msg.author_id)}
          />
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter message..."
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-sm leading-none"
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-20 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </>
  )
}
