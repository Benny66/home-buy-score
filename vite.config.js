import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
   // 1. 确保插件正常启用
   plugins: [vue(), viteSingleFile()],
   // 2. 路径别名配置（可选，避免路径层级错误）
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src') // 配置@指向src，方便组件引用
     }
   },
   // 3. 强制所有资源内联，消除外部依赖
   build: {
     target: 'es2020',
     // 把资源内联阈值调到最大，确保所有资源都嵌入HTML（默认4096字节，这里改为100MB）
     assetsInlineLimit: 1024 * 1024 * 100,
     rollupOptions: {
       output: {
         // 内联动态导入的资源（关键：避免动态加载的组件/资源未内联）
         inlineDynamicImports: true,
         // 确保所有资源都打包到HTML中，不生成外部文件
         format: 'esm'
       }
     },
     // 禁用CSS代码分割，确保CSS内联到HTML（关键：避免CSS文件缺失）
     cssCodeSplit: false,
     // 禁用sourcemap，避免生成额外的.map文件（无关资源，减少干扰）
     sourcemap: false
   }
})
