import { Loader2, ArrowDown } from "lucide-react"
import MessageItem from "./MessageItem"
import type { DMMessage } from "@/types/message"
import type { RefObject } from "react"

interface MessageListProps {
  messages: DMMessage[]
  ownMessageIds?: Set<string> // 익명 라운지에서 내가 쓴 메시지 (sender_id가 비어 있음)
  loading: boolean
  userId: string | undefined
  isThemeAmber: boolean
  scrollRef: RefObject<HTMLDivElement | null>
  showNewMessageAlert: boolean
  onScroll: () => void
  onScrollToBottom: () => void
  onDismissAlert: () => void
  sentinelRef: (node?: Element | null) => void
  isFetchingNextPage: boolean
}

export default function MessageList({
  messages,
  ownMessageIds,
  loading,
  userId,
  isThemeAmber,
  scrollRef,
  showNewMessageAlert,
  onScroll,
  onScrollToBottom,
  onDismissAlert,
  sentinelRef,
  isFetchingNextPage
}: MessageListProps) {
  return (
    <>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-mono">SYNCHRONIZING SECURE STREAM...</p>
          </div>
        ) : (
          <>
            {/* Sentinel for infinite scroll (at the top) */}
            <div ref={sentinelRef} className="h-4 flex justify-center items-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>

            {messages.map((msg) => {
              const senderId = msg.sender_id || msg.user_id
              const isOwn = senderId === userId || !!ownMessageIds?.has(msg.id)

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  isThemeAmber={isThemeAmber}
                />
              )
            })}
          </>
        )}
      </div>

      {/* New Message Alert */}
      {showNewMessageAlert && (
        <div className="absolute bottom-[80px] left-0 right-0 flex justify-center z-10 pointer-events-none">
          <button
            onClick={() => {
              onScrollToBottom()
              onDismissAlert()
            }}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/20 text-xs font-bold animate-bounce"
          >
            <ArrowDown className="w-3 h-3" />
            New Message
          </button>
        </div>
      )}
    </>
  )
}
