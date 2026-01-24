import { useState, useEffect } from "react"
import { generateRandomNickname } from "@/utils/nicknameUtils"

export function useAnonymousNickname(chatId: string, chatType: string, countryCode?: string) {
  const [anonNickname, setAnonNickname] = useState<string>("")

  useEffect(() => {
    if (chatType === 'open') {
      const saved = localStorage.getItem(`anon_nick_${chatId}`)
      if (saved) {
        setAnonNickname(saved)
      } else {
        const newNick = generateRandomNickname(countryCode || 'UN')
        setAnonNickname(newNick)
        localStorage.setItem(`anon_nick_${chatId}`, newNick)
      }
    }
  }, [chatId, chatType, countryCode])

  return anonNickname
}
