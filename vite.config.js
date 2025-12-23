import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteSingleFile() // 启用单文件打包插件
  ],
  // 可选配置：优化打包（根据需要调整）
  build: {
    target: 'es2020', // 兼容更多浏览器（可选）
    assetsInlineLimit: 100000000, // 强制所有资源内联（默认4096字节，这里调大避免遗漏）
    rollupOptions: {
      output: {
        inlineDynamicImports: true // 内联动态导入的资源（可选，确保无遗漏）
      }
    }
  }
})
