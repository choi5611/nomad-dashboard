import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { Send, Loader2, ArrowDown } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { useScrollBehavior } from "@/hooks/useScrollBehavior"
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
  loading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage: () => void
}

export default function CityChat({
  cityName,
  messages,
  onlineCount,
  userId,
  onSendMessage,
  onProfileClick,
  disabled,
  loading,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage
}: CityChatProps) {
  const [inputValue, setInputValue] = useState("")
  const isInitialLoadDoneRef = useRef(false)
  const previousScrollHeightRef = useRef<number>(0)
  const previousScrollTopRef = useRef<number>(0)

  // 공통 스크롤 동작 사용 및 구조 분해 할당으로 에러 방지
  const { 
    scrollRef, 
    handleScroll, 
    showNewMessageAlert, 
    scrollToBottom, 
    scrollToBottomInstant, 
    restoreScroll 
  } = useScrollBehavior(messages, userId)
  
  // 무한 스크롤 감지 (최상단)
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
  })

  // 채팅방 변경 시 초기화
  useEffect(() => {
    isInitialLoadDoneRef.current = false
  }, [cityName])

  // 이전 메시지 로딩 트리거
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      const scrollEl = scrollRef.current
      if (scrollEl) {
        previousScrollHeightRef.current = scrollEl.scrollHeight
        previousScrollTopRef.current = scrollEl.scrollTop
      }
      onFetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, onFetchNextPage, scrollRef])

  // 스크롤 위치 복원
  useLayoutEffect(() => {
    if (!isFetchingNextPage && previousScrollHeightRef.current > 0) {
      restoreScroll(previousScrollHeightRef.current, previousScrollTopRef.current)
      previousScrollHeightRef.current = 0
      previousScrollTopRef.current = 0
    }
  }, [isFetchingNextPage, messages.length, restoreScroll])

  // 초기 로딩 시 바닥으로
  useEffect(() => {
    if (!loading && messages.length > 0 && !isInitialLoadDoneRef.current) {
      scrollToBottomInstant()
      isInitialLoadDoneRef.current = true
    }
  }, [loading, messages.length, scrollToBottomInstant])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    onSendMessage(inputValue.trim())
    setInputValue("")
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 bg-white/5 shrink-0">
        <p className="text-[10px] text-cyan-400 font-mono tracking-tighter uppercase">
          Secure Link to {cityName} Terminal • {onlineCount} Active Nomads
        </p>
      </div>
      
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-mono">INITIALIZING TERMINAL...</p>
          </div>
        ) : (
          <>
            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="h-4 flex justify-center items-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-white/30 text-[10px] font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>FETCHING HISTORY...</span>
                </div>
              )}
            </div>

            {messages.map((msg, idx) => (
              <CityMessageItem
                key={msg.id || idx}
                message={msg}
                isOwn={msg.author_id === userId}
                onProfileClick={() => onProfileClick(msg.author_id)}
              />
            ))}
          </>
        )}
      </div>

      {/* New Message Alert */}
      {showNewMessageAlert && (
        <div className="absolute bottom-[80px] left-0 right-0 flex justify-center z-10 pointer-events-none">
          <button
            onClick={scrollToBottom}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/20 text-[10px] font-bold animate-bounce uppercase tracking-tighter"
          >
            <ArrowDown className="w-3 h-3" />
            New Signal
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            maxLength={1000}
            placeholder="Enter message..."
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
    </div>
  )
}
