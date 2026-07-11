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
import RoomPreviewModal from "./RoomPreviewModal"
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false) // 정보 모달용
  const [roomData, setRoomData] = useState<ChatRoom | null>(null)
  const [memberIds, setMemberIds] = useState<string[]>([])
  // 헤더에 표시할 채팅방 이름 (프롭 직접 변형 대신 로컬 상태로 관리)
  const [displayName, setDisplayName] = useState(chat.name)
  const [prevChatId, setPrevChatId] = useState(chat.id)
  if (chat.id !== prevChatId) {
    setPrevChatId(chat.id)
    setDisplayName(chat.name)
  }
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 방 정보 비동기 fetch (채팅 변경 시 setState는 await 이후)
    fetchRoomInfo()
  }, [chat.id, chat.type])

  // 익명 닉네임 관리
  const anonNickname = useAnonymousNickname(chat.id, chat.type, profile?.country_code)

  const { messages, loading, fetchNextPage, hasNextPage, isFetchingNextPage, handleSendMessage, handleLeaveChat } = useMessages(chat, user)

  // 스크롤 동작 관리 (새 메시지 수신 시 스크롤/알림도 messages 변화 감지로 처리)
  const scrollControl = useScrollBehavior(messages, user?.id)

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      const scrollEl = scrollControl.scrollRef.current
      if (scrollEl) {
        previousScrollHeightRef.current = scrollEl.scrollHeight
        previousScrollTopRef.current = scrollEl.scrollTop
      }
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, scrollControl.scrollRef])

  const isInitialLoadDoneRef = useRef(false)

  useEffect(() => {
    isInitialLoadDoneRef.current = false
  }, [chat.id])

  useLayoutEffect(() => {
    if (!isFetchingNextPage && previousScrollHeightRef.current > 0) {
      scrollControl.restoreScroll(previousScrollHeightRef.current, previousScrollTopRef.current)
      previousScrollHeightRef.current = 0
      previousScrollTopRef.current = 0
    }
  }, [isFetchingNextPage, messages.length, scrollControl])

  useEffect(() => {
    if (!loading && messages.length > 0 && !isInitialLoadDoneRef.current) {
      scrollControl.scrollToBottomInstant()
      isInitialLoadDoneRef.current = true
    }
  }, [loading, messages.length, scrollControl])

  const isThemeAmber = chat.type === 'open'

  // 수정 권한 확인
  const canEdit = user && roomData?.created_by === user.id

  // 수정 모달 열기 전에 최신 데이터 가져오기
  const handleEditClick = async () => {
    await fetchRoomInfo()
    setIsEditModalOpen(true)
  }

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isThemeAmber ? 'bg-amber-950/20' : 'bg-slate-900/50'}`}>
      <ChatHeader
        chat={{ ...chat, name: displayName }}
        anonNickname={anonNickname}
        onBack={onBack}
        onLeave={chat.type !== 'dm' ? () => setIsLeaveModalOpen(true) : undefined}
        onEdit={canEdit ? handleEditClick : undefined}
        onInvite={chat.type !== 'dm' ? () => setIsInviteModalOpen(true) : undefined}
        onInfo={chat.type !== 'dm' ? () => setIsPreviewOpen(true) : undefined}
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
        title={chat.type === 'open' ? "Exit Lounge" : "Leave Group Chat"}
        message={
          chat.type === 'open' 
            ? "이 오픈채팅방 목록에서 나가시겠습니까? 다시 입장하기 전까지 알림을 받을 수 없습니다."
            : "정말 이 채팅방을 나가시겠습니까? 대화 내용은 더 이상 볼 수 없습니다."
        }
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
        onSuccess={async (_, name, __) => {
          setDisplayName(name)
          setIsEditModalOpen(false)
          await fetchRoomInfo()
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

      <RoomPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        room={roomData}
        onJoin={() => setIsPreviewOpen(false)} // 이미 들어와 있으므로 그냥 닫기
      />
    </div>
  )
}
