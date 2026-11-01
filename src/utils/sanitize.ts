/**
 * 검색어·해시태그 입력 정리 유틸리티
 * (화면 출력은 React가 이스케이프하므로 HTML 제거 함수는 두지 않는다 — dangerouslySetInnerHTML 금지)
 */

/**
 * 검색어 정리: 앞뒤 공백 제거 + 최대 100자
 * 값은 supabase-js가 URL 파라미터로 보내고 화면 출력은 React가 이스케이프하므로
 * 단어를 지우지 않는다 (예전처럼 "script"를 지우면 "TypeScript" → "Type"이 됐음)
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ''
  return query.trim().substring(0, 100)
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
