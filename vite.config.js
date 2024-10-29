import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { chromeExtension } from 'vite-plugin-chrome-extension'
import { resolve } from 'path'

const manifest = resolve(__dirname, 'manifest.json')

export default defineConfig(({ mode }) => ({
  plugins: [preact(), chromeExtension({ manifest })],
  build: {
    sourcemap: mode === 'development' ? 'inline' : false,
    minify: mode === 'production',
    rollupOptions: {
      input: "manifest.json",
    },
  },
}))
