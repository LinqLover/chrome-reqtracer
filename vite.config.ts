import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { defineConfig, PluginOption } from 'vite'
import { chromeExtension } from 'vite-plugin-chrome-extension'
import { ChromeExtensionOptions } from 'vite-plugin-chrome-extension/types/plugin-options'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const manifest = resolve(__dirname, 'manifest.json')

export default defineConfig(({ mode }) => ({
  plugins: [
    preact(),
    chromeExtension({ manifest } as ChromeExtensionOptions) as unknown as PluginOption,
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
