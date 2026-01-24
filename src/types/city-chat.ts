export interface CityMessage {
  id: string
  content: string
  author_id: string
  city_id: string
  created_at: string
  profiles?: {
    username: string
    avatar_url: string
    country_code: string
  }
}

export const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return ""
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
