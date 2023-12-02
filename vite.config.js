import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/preview': 'http://127.0.0.1:8000',
    },
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
  build: {
    minify: false,
    lib: {
      entry: resolve('src/VisualEditor.js'),
      name: 'VisualEditor',
      formats: ['es'],
      fileName: () => 'VisualEditor.standalone.js',
    },
  },
})
