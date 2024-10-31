const { defineConfig, chromium } = require('@playwright/test')
const path = require('path')

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
  },
})