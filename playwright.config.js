// @ts-check
const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  // Serve the built dist/ so the suite is self-contained.
  webServer: {
    command: 'npx serve -l 7891 -s dist',
    url: 'http://localhost:7891',
    reuseExistingServer: !process.env.CI,
    timeout: 60000
  },

  use: {
    baseURL: 'http://localhost:7891',
    // 1920x1080 TV viewport as configured in nuxt.config.js
    viewport: { width: 1920, height: 1080 },
    // Emulate webOS TV user agent
    userAgent: 'Mozilla/5.0 (SmartTV; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 SmartTv/LG/webOS/3.0',
    screenshot: 'only-on-failure',
    video: 'off',
    // Give the app time to load assets
    navigationTimeout: 15000,
    actionTimeout: 8000,
  },

  projects: [
    {
      name: 'chromium-tv',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH
            ? undefined
            : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        },
      },
    },
  ],
})
