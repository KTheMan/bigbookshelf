// @ts-check
const fs = require('fs')
const { defineConfig, devices } = require('@playwright/test')

// In the dev container Chromium lives at a fixed path; in CI / on other machines
// Playwright resolves the browser it installed itself. Only pin the explicit path
// when it actually exists, otherwise let Playwright find its own (executablePath
// undefined) so `npx playwright install` works everywhere.
const DEV_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const LOCAL_BROWSER_CANDIDATES = [
  DEV_CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
]
const executablePath = LOCAL_BROWSER_CANDIDATES.find((browserPath) => fs.existsSync(browserPath))

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  // Serve the built dist/ so the suite is self-contained.
  webServer: {
    command: 'node ./node_modules/serve/build/main.js -l 7891 -s dist',
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
          executablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        },
      },
    },
  ],
})
