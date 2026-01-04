import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'  
// import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const enableSingleFile = env.VITE_SINGLE_FILE === 'true'
  // 打印环境变量（调试用）
  console.log('VITE_SINGLE_FILE:', env.VITE_SINGLE_FILE)
  console.log('enableSingleFile:', enableSingleFile)

  // 动态配置插件
  const plugins = [vue()]
  if (enableSingleFile) {
    // plugins.push(viteSingleFile())
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      target: 'es2020',
      // 根据单文件模式调整配置
      assetsInlineLimit: enableSingleFile ? 1024 * 1024 * 100 : 4096,
      rollupOptions: enableSingleFile ? {
        output: {
          inlineDynamicImports: true, // 单文件模式需要内联动态导入
          format: 'esm'
        }
      } : {
        output: {
          // 多文件模式的代码分割策略
          manualChunks: {
            vendor: ['vue', 'vue-router'], // 第三方库
            element: ['element-plus'], // 组件库单独分包
            echarts: ['echarts', 'vue-echarts'] // 图表库单独分包
          }
        }
      },
      cssCodeSplit: !enableSingleFile, // 单文件模式禁用CSS分割
      sourcemap: !enableSingleFile, // 单文件模式禁用sourcemap
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,    // 移除console
          drop_debugger: true    // 移除debugger
        }
      }
    }
  }
})



