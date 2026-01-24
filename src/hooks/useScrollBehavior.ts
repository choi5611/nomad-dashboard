import { useState, useEffect, useRef } from "react"
import type { DMMessage } from "@/types/message"

export function useScrollBehavior(
  messages: DMMessage[],
  userId: string | undefined
) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false)
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false)
  const lastMessageIdRef = useRef<string | null>(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current

    // 바닥에서 50px 이상 떨어져 있으면 "올려본 상태"로 간주
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsUserScrolledUp(!isAtBottom)

    // 바닥에 도달하면 새 메시지 알림 끄기
    if (isAtBottom) {
      setShowNewMessageAlert(false)
    }
  }

  // 메시지가 추가될 때의 스크롤 동작
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    const isNew = lastMsg.id !== lastMessageIdRef.current
    lastMessageIdRef.current = lastMsg.id

    if (!isNew) return // 초기 로딩 등 변화 없을 땐 패스

    // 내 메시지면 무조건 내리기
    if (lastMsg.sender_id === userId || lastMsg.user_id === userId) {
      scrollToBottom()
      return
    }

    // 다른 사람 메시지일 때
    if (isUserScrolledUp) {
      // 보고 있는 위치가 위쪽이면 알림만 띄움
      setShowNewMessageAlert(true)
    } else {
      // 보고 있는 위치가 바닥이면 같이 내림
      scrollToBottom()
    }
  }, [messages, userId, isUserScrolledUp])

  return {
    scrollRef,
    showNewMessageAlert,
    setShowNewMessageAlert,
    scrollToBottom,
    handleScroll
  }
}
