import { Loader2, ArrowDown } from "lucide-react"
import MessageItem from "./MessageItem"
import type { DMMessage } from "@/types/message"
import type { RefObject } from "react"

interface MessageListProps {
  messages: DMMessage[]
  loading: boolean
  userId: string | undefined
  isThemeAmber: boolean
  scrollRef: RefObject<HTMLDivElement | null>
  showNewMessageAlert: boolean
  onScroll: () => void
  onScrollToBottom: () => void
  onDismissAlert: () => void
}

export default function MessageList({
  messages,
  loading,
  userId,
  isThemeAmber,
  scrollRef,
  showNewMessageAlert,
  onScroll,
  onScrollToBottom,
  onDismissAlert
}: MessageListProps) {
  return (
    <>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-mono">SYNCHRONIZING SECURE STREAM...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender_id || msg.user_id
            const isOwn = senderId === userId

            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                isThemeAmber={isThemeAmber}
              />
            )
          })
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
