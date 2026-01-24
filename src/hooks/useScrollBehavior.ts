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
    if (!scrollRef.current) return
    
    // 메시지가 비워지면 ID 추적 리셋
    if (messages.length === 0) {
      lastMessageIdRef.current = null
      return
    }

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
      // setTimeout을 사용하여 렌더링 사이클 외부에서 상태를 업데이트함 (ESLint 에러 방지)
      setTimeout(() => setShowNewMessageAlert(true), 0)
    } else {
      // 보고 있는 위치가 바닥이면 같이 내림
      scrollToBottom()
    }
  }, [messages, userId, isUserScrolledUp])

  const restoreScroll = (previousScrollHeight: number, previousScrollTop: number = 0) => {
    if (scrollRef.current && previousScrollHeight > 0) {
      const scrollEl = scrollRef.current
      const originalBehavior = scrollEl.style.scrollBehavior
      scrollEl.style.scrollBehavior = 'auto'
      
      const newScrollHeight = scrollEl.scrollHeight
      const heightDiff = newScrollHeight - previousScrollHeight
      
      if (heightDiff > 0) {
        // 늘어난 높이 + 기존에 있었던 미세한 위치값(scrollTop)을 더해줌
        scrollEl.scrollTop = heightDiff + previousScrollTop
      }
      
      scrollEl.style.scrollBehavior = originalBehavior
    }
  }

  const scrollToBottomInstant = () => {
    if (scrollRef.current) {
      const scrollEl = scrollRef.current
      const originalBehavior = scrollEl.style.scrollBehavior
      scrollEl.style.scrollBehavior = 'auto'
      scrollEl.scrollTop = scrollEl.scrollHeight
      
      setTimeout(() => {
        if (scrollEl) scrollEl.style.scrollBehavior = originalBehavior
      }, 50)
    }
  }

  return {
    scrollRef,
    showNewMessageAlert,
    setShowNewMessageAlert,
    scrollToBottom,
    scrollToBottomInstant,
    restoreScroll,
    handleScroll
  }
}
