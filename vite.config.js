import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue' 
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const enableSingleFile = env.VITE_SINGLE_FILE === 'true'
  // 打印环境变量
  console.log('VITE_SINGLE_FILE:', env.VITE_SINGLE_FILE)
  console.log('enableSingleFile:', enableSingleFile)
  // 动态配置插件
  const plugins = [vue()]
  if (enableSingleFile) {
    plugins.push(viteSingleFile())
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
      assetsInlineLimit: enableSingleFile ? 1024 * 1024 * 100 : 4096, // 根据模式调整阈值
      rollupOptions: {
        output: {
          inlineDynamicImports: enableSingleFile, // 仅在单文件模式下启用
          format: 'esm'
        }
      },
      cssCodeSplit: !enableSingleFile, // 单文件模式下禁用CSS分割
      sourcemap: !enableSingleFile // 单文件模式下禁用sourcemap
    }
  }
})

