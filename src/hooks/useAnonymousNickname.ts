import { useState, useEffect } from "react"
import { generateRandomNickname } from "@/utils/nicknameUtils"

export function useAnonymousNickname(chatId: string, chatType: string, countryCode?: string) {
  const [anonNickname, setAnonNickname] = useState<string>("")

  useEffect(() => {
    if (chatType !== 'open') return

    let nick = localStorage.getItem(`anon_nick_${chatId}`)
    if (!nick) {
      nick = generateRandomNickname(countryCode || 'UN')
      localStorage.setItem(`anon_nick_${chatId}`, nick)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage(외부 저장소)와 동기화하는 정당한 effect
    setAnonNickname(nick)
  }, [chatId, chatType, countryCode])

  return anonNickname
}
