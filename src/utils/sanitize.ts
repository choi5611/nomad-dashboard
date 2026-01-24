/**
 * XSS 방어를 위한 입력 검증 및 Sanitization 유틸리티
 */

/**
 * HTML 태그를 제거하여 순수 텍스트만 반환
 * XSS 공격을 방지하기 위해 사용자 입력에서 모든 HTML 태그를 제거합니다.
 */
export function sanitizeText(input: string): string {
  if (!input) return ''

  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // script 태그와 내용 완전 제거
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&lt;/g, '<') // HTML 엔티티 디코드
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim()
}

/**
 * 검색어를 안전하게 처리
 * SQL Injection 및 XSS를 방어합니다.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ''

  return query
    .replace(/javascript\s*:/gi, '') // javascript: 프로토콜 제거 (공백 포함)
    .replace(/[<>\"']/g, '') // 위험한 문자 제거
    .replace(/script/gi, '') // script 단어 제거 (대소문자 무관)
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거 (onClick, onLoad 등)
    .trim()
    .substring(0, 100) // 최대 길이 제한
}

/**
 * 해시태그를 안전하게 처리
 */
export function sanitizeHashtag(hashtag: string): string {
  if (!hashtag) return ''

  // 해시태그는 영문, 숫자, 한글, 언더스코어만 허용
  return hashtag
    .replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ_]/g, '')
    .substring(0, 50) // 최대 50자
}

/**
 * 사용자 이름을 안전하게 처리
 */
export function sanitizeUsername(username: string): string {
  if (!username) return ''

  // 사용자 이름은 영문, 숫자, 한글, 언더스코어, 하이픈만 허용
  return username
    .replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ_\-\s]/g, '')
    .substring(0, 30) // 최대 30자
    .trim()
}

/**
 * URL을 검증하여 안전한 프로토콜인지 확인
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    // http, https만 허용
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * 게시물 내용을 안전하게 처리
 * 기본 텍스트만 허용하고, 줄바꿈은 유지
 */
export function sanitizePostContent(content: string): string {
  if (!content) return ''

  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // script 태그 완전 제거
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // iframe 태그 제거
    .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // 이벤트 핸들러 제거
    .substring(0, 5000) // 최대 5000자
    .trim()
}
