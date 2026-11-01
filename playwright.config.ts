import { defineConfig, devices } from '@playwright/test'

// e2e는 *.e2e.ts만 (vitest의 *.test/*.spec 패턴과 겹치지 않게)
// CI 러너는 GPU가 없어 지구본을 소프트웨어로 그리므로 느리다. 브라우저 2개를 동시에 돌리면 CPU가 부족해
// supabase 인증 락 대기가 시간 초과로 중단(AbortError)되므로 CI에선 1개씩, 넉넉한 시간으로 돌린다.
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: isCI ? 60_000 : 30_000,
  workers: isCI ? 1 : undefined,
  retries: isCI ? 1 : 0,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
