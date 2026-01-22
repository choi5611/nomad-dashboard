const ADJECTIVES = ["용감한", "우아한", "즐거운", "고독한", "창의적인", "열정적인", "평화로운", "빛나는"]
const ANIMALS = ["노마드", "여행자", "방랑자", "탐험가", "가이드", "항해사", "서퍼", "아티스트"]

export function generateRandomNickname(countryCode: string) {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${countryCode}의 ${adj} ${animal}`
}
