import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { chromeExtension } from 'vite-plugin-chrome-extension'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const manifest = resolve(__dirname, 'manifest.json')

export default defineConfig(({ mode }) => ({
  plugins: [
    preact(),
    chromeExtension({ manifest }),
    cssInjectedByJsPlugin(),
  ],
  build: {
    sourcemap: mode === 'development' ? 'inline' : false,
    minify: mode === 'production',
    rollupOptions: {
      input: "manifest.json",
    },
  },
}))
