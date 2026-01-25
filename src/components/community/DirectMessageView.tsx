import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { useAuth } from "@/store/useAuth"
import { useInView } from "react-intersection-observer"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { useAnonymousNickname } from "@/hooks/useAnonymousNickname"
import { useScrollBehavior } from "@/hooks/useScrollBehavior"
import { useMessages } from "@/hooks/useMessages"
import ChatHeader from "./ChatHeader"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import CreateChatModal from "./CreateChatModal"
import InviteFriendsModal from "./InviteFriendsModal"
import { useFriends } from "@/hooks/useFriends"
import { supabase } from "@/lib/supabase"
import type { ChatRoom } from "@/types/friend"
import type { ChatInfo } from "@/types/message"

interface DirectMessageViewProps {
  chat: ChatInfo
  onBack: () => void
}

export default function DirectMessageView({ chat, onBack }: DirectMessageViewProps) {
  const { user, profile } = useAuth()
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [roomData, setRoomData] = useState<ChatRoom | null>(null)
  const [memberIds, setMemberIds] = useState<string[]>([])
  const { friends } = useFriends(user, profile)
  const previousScrollHeightRef = useRef<number>(0)
  const previousScrollTopRef = useRef<number>(0)

  // 방 정보 및 멤버 목록 가져오기
  const fetchRoomInfo = async () => {
    if (chat.type === 'dm') return

    const { data: room } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', chat.id)
      .single()
    if (room) setRoomData(room)

    const { data: members } = await supabase
      .from('room_members')
      .select('user_id')
      .eq('room_id', chat.id)
    if (members) setMemberIds(members.map(m => m.user_id))
  }

  useEffect(() => {
    fetchRoomInfo()
  }, [chat.id, chat.type])

  // 익명 닉네임 관리
  const anonNickname = useAnonymousNickname(chat.id, chat.type, profile?.country_code)

  // 스크롤 동작 관리 - scrollToBottom 함수를 먼저 만듦
  const scrollControlTemp = useScrollBehavior([], user?.id)

  // 메시지 관리
  const { messages, loading, fetchNextPage, hasNextPage, isFetchingNextPage, handleSendMessage, handleLeaveChat } = useMessages(
    chat,
    user,
    profile,
    scrollControlTemp.scrollToBottom
  )

  // 실제 messages를 받는 스크롤 동작
  const scrollControl = useScrollBehavior(messages, user?.id)

  // 무한 스크롤 감지 (메시지 목록 맨 위)
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
  })

  // 이전 메시지 로드 전 스크롤 위치 저장 (scrollHeight 기준)
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      const scrollEl = scrollControl.scrollRef.current
      if (scrollEl) {
        // 현재 총 높이와 현재 스크롤 위치를 모두 저장 (미세 보정용)
        previousScrollHeightRef.current = scrollEl.scrollHeight
        previousScrollTopRef.current = scrollEl.scrollTop
      }
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, scrollControl.scrollRef])

  const isInitialLoadDoneRef = useRef(false)

  // 채팅방 변경 시 초기화
  useEffect(() => {
    isInitialLoadDoneRef.current = false
  }, [chat.id])

  // 이전 메시지 로드 후 스크롤 위치 복원
  // useLayoutEffect를 사용하여 화면이 그려지기 전에 스크롤 위치를 조절하여 루프를 방지합니다.
  useLayoutEffect(() => {
    if (!isFetchingNextPage && previousScrollHeightRef.current > 0) {
      scrollControl.restoreScroll(previousScrollHeightRef.current, previousScrollTopRef.current)
      previousScrollHeightRef.current = 0
      previousScrollTopRef.current = 0
    }
  }, [isFetchingNextPage, messages.length, scrollControl])

  // 초기 로드 완료 시 스크롤을 맨 아래로 (즉시, 애니메이션 없이, 최초 1회만)
  useEffect(() => {
    if (!loading && messages.length > 0 && !isInitialLoadDoneRef.current) {
      scrollControl.scrollToBottomInstant()
      isInitialLoadDoneRef.current = true
    }
  }, [loading, messages.length, scrollControl])

  const isThemeAmber = chat.type === 'open'

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isThemeAmber ? 'bg-amber-950/20' : 'bg-slate-900/50'}`}>
      <ChatHeader
        chat={chat}
        anonNickname={anonNickname}
        onBack={onBack}
        onLeave={chat.type !== 'dm' ? () => {
          if (chat.type === 'open') onBack()
          else setIsLeaveModalOpen(true)
        } : undefined}
        onEdit={user && roomData?.created_by === user.id ? () => setIsEditModalOpen(true) : undefined}
        onInvite={chat.type !== 'dm' ? () => setIsInviteModalOpen(true) : undefined}
      />

      <MessageList
        messages={messages}
        loading={loading}
        userId={user?.id}
        isThemeAmber={isThemeAmber}
        scrollRef={scrollControl.scrollRef}
        showNewMessageAlert={scrollControl.showNewMessageAlert}
        onScroll={scrollControl.handleScroll}
        onScrollToBottom={scrollControl.scrollToBottom}
        onDismissAlert={() => scrollControl.setShowNewMessageAlert(false)}
        sentinelRef={sentinelRef}
        isFetchingNextPage={isFetchingNextPage}
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

      <CreateChatModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        initialData={roomData}
        onSuccess={(_, name) => {
          chat.name = name
          setIsEditModalOpen(false)
          fetchRoomInfo()
        }}
      />

      <InviteFriendsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomId={chat.id}
        currentMemberIds={memberIds}
        friends={friends}
        onSuccess={fetchRoomInfo}
      />
    </div>
  )
}
