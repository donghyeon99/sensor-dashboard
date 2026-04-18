import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))

function gitInfo() {
  try {
    const sha = execSync('git rev-parse --short HEAD').toString().trim()
    let tag = ''
    try { tag = execSync('git describe --tags --abbrev=0').toString().trim() } catch { /* no tag */ }
    return { sha, tag }
  } catch {
    return { sha: 'unknown', tag: '' }
  }
}

const { sha, tag } = gitInfo()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_GIT_SHA__: JSON.stringify(sha),
    __APP_GIT_TAG__: JSON.stringify(tag),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
