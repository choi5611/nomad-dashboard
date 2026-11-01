import { test, expect, type Page } from '@playwright/test'

// 로그인 없이 읽기만 하는 스모크 테스트. .env의 운영 Supabase에 붙으므로 데이터를 쓰는 동작은 넣지 않는다.

function collectPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

async function selectCity(page: Page, name: string) {
  await page.getByPlaceholder(/어디로 떠날까요/).fill(name)
  await page.getByRole('button', { name: new RegExp(`^${name} .*Activated`) }).click()
  await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
}

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop 전용')

  test('앱이 뜨고 지구본과 헤더가 보인다', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/Nomad Dashboard/)
    await expect(page.locator('canvas').first()).toBeVisible()
    await expect(page.getByText(/nomads online/)).toBeVisible()
    await expect(page.getByText('EQUATOR/MERIDIAN')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('도시를 검색해 고르면 그 도시 피드가 열린다', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/')
    await selectCity(page, 'Tokyo')
    await expect(page.getByText('게시글을 불러오는 중...')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('로그인 버튼을 누르면 로그인 모달이 열린다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    await expect(page.getByText('Hello Trabler!')).toBeVisible()
    await expect(page.getByPlaceholder('이메일 주소')).toBeVisible()
  })

  test('채팅 터미널이 열리고 로그인 전에는 입력이 막혀 있다', async ({ page }) => {
    await page.goto('/')
    await selectCity(page, 'Seoul')
    await page.getByTitle('실시간 채팅').click()
    await expect(page.getByRole('heading', { name: 'Terminal' })).toBeVisible()
    await expect(page.getByText('CITY HUB')).toBeVisible()
    await expect(page.getByPlaceholder('Enter message...')).toBeDisabled()
  })
})

test.describe('service worker', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop에서 한 번만')

  test('Supabase API 응답은 캐시에 저장하지 않는다', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null)
    await selectCity(page, 'Tokyo') // 서비스 워커가 제어하는 상태에서 Supabase 요청 발생
    await expect(page.getByText('게시글을 불러오는 중...')).toHaveCount(0)

    const cachedUrls = await page.evaluate(async () => {
      const urls: string[] = []
      for (const name of await caches.keys()) {
        const cache = await caches.open(name)
        for (const req of await cache.keys()) urls.push(req.url)
      }
      return urls
    })
    expect(cachedUrls.length).toBeGreaterThan(0) // 같은 출처 파일은 캐시됨 (서비스 워커 동작 확인)
    expect(cachedUrls.filter((u) => u.includes('supabase.co'))).toEqual([])
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile 전용')

  test('하단 내비게이션으로 Chat / Me 화면을 오간다', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/')
    const nav = page.locator('nav')
    await nav.getByRole('button', { name: 'Chat', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Terminal' })).toBeVisible()
    await nav.getByRole('button', { name: 'Me', exact: true }).click()
    await expect(page.getByText('사용자 설정')).toBeVisible()
    await expect(page.getByText('로그인이 필요합니다').first()).toBeVisible()
    expect(errors).toEqual([])
  })
})
