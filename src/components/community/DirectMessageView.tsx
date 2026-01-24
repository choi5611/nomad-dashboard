import { useState } from "react"
import { useAuth } from "@/store/useAuth"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { useAnonymousNickname } from "@/hooks/useAnonymousNickname"
import { useScrollBehavior } from "@/hooks/useScrollBehavior"
import { useMessages } from "@/hooks/useMessages"
import ChatHeader from "./ChatHeader"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import type { ChatInfo } from "@/types/message"

interface DirectMessageViewProps {
  chat: ChatInfo
  onBack: () => void
}

export default function DirectMessageView({ chat, onBack }: DirectMessageViewProps) {
  const { user, profile } = useAuth()
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  // 익명 닉네임 관리
  const anonNickname = useAnonymousNickname(chat.id, chat.type, profile?.country_code)

  // 스크롤 동작 관리 - scrollToBottom 함수를 먼저 만듦
  const scrollBehaviorTemp = useScrollBehavior([], user?.id)

  // 메시지 관리
  const { messages, loading, handleSendMessage, handleLeaveChat } = useMessages(
    chat,
    user,
    profile,
    scrollBehaviorTemp.scrollToBottom
  )

  // 실제 messages를 받는 스크롤 동작
  const scrollBehavior = useScrollBehavior(messages, user?.id)

  const isThemeAmber = chat.type === 'open'

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isThemeAmber ? 'bg-amber-950/20' : 'bg-slate-900/50'}`}>
      <ChatHeader
        chat={chat}
        anonNickname={anonNickname}
        onBack={onBack}
        onLeave={chat.type === 'group' ? () => setIsLeaveModalOpen(true) : undefined}
      />

      <MessageList
        messages={messages}
        loading={loading}
        userId={user?.id}
        isThemeAmber={isThemeAmber}
        scrollRef={scrollBehavior.scrollRef}
        showNewMessageAlert={scrollBehavior.showNewMessageAlert}
        onScroll={scrollBehavior.handleScroll}
        onScrollToBottom={scrollBehavior.scrollToBottom}
        onDismissAlert={() => scrollBehavior.setShowNewMessageAlert(false)}
      />

      <MessageInput
        chat={chat}
        anonNickname={anonNickname}
        onSend={(content) => handleSendMessage(content, anonNickname)}
      />

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        title="Leave Group Chat"
        message="정말 이 채팅방을 나가시겠습니까? 대화 내용은 더 이상 볼 수 없습니다."
        confirmText="나가기"
        cancelText="취소"
        onConfirm={() => handleLeaveChat(onBack)}
        onClose={() => setIsLeaveModalOpen(false)}
      />
    </div>
  )
}
