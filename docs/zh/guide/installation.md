# 安装

本页面将指导您如何在项目中安装和配置 Pinia。

## 兼容性

Pinia 需要 Vue 2.7+ 或 Vue 3.2+。如果您使用的是 Vue 2，还需要安装组合式 API：`@vue/composition-api`。

## 包管理器安装

::: code-group

```bash [npm]
npm install pinia
```

```bash [yarn]
yarn add pinia
```

```bash [pnpm]
pnpm add pinia
```

:::

## CDN 安装

如果您不使用构建工具，可以通过 CDN 使用 Pinia：

```html
<script src="https://unpkg.com/vue@next"></script>
<script src="https://unpkg.com/pinia@next"></script>
```

## 创建 Pinia 实例

安装完成后，您需要创建一个 Pinia 实例并将其传递给 Vue 应用：

### Vue 3

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### Vue 2

```javascript
// main.js
import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'
import App from './App.vue'

Vue.use(PiniaVuePlugin)
const pinia = createPinia()

new Vue({
  el: '#app',
  pinia,
  render: h => h(App)
})
```

## TypeScript 支持

Pinia 提供了完整的 TypeScript 支持。如果您使用 TypeScript，无需额外配置即可享受类型安全的好处。

### 类型定义

```typescript
// stores/types.ts
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface UserState {
  currentUser: User | null
  users: User[]
  loading: boolean
}
```

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import type { User, UserState } from './types'

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    users: [],
    loading: false
  }),
  
  getters: {
    isAdmin: (state): boolean => {
      return state.currentUser?.role === 'admin'
    }
  },
  
  actions: {
    async fetchUser(id: number): Promise<User> {
      this.loading = true
      try {
        const user = await api.getUser(id)
        this.currentUser = user
        return user
      } finally {
        this.loading = false
      }
    }
  }
})
```

## Nuxt.js 集成

如果您使用 Nuxt.js，可以使用官方的 `@pinia/nuxt` 模块：

```bash
npm install pinia @pinia/nuxt
```

```javascript
// nuxt.config.js
export default {
  modules: [
    '@pinia/nuxt'
  ]
}
```

## Vite 配置

如果您使用 Vite，可能需要配置路径别名：

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

## 开发工具

### Vue DevTools

Pinia 完全支持 Vue DevTools。安装 Vue DevTools 浏览器扩展后，您可以：

- 查看所有 stores 的状态
- 时间旅行调试
- 编辑状态值
- 追踪 actions 的执行

### VS Code 扩展

推荐安装以下 VS Code 扩展以获得更好的开发体验：

- **Vetur** 或 **Volar**：Vue 语法高亮和智能提示
- **TypeScript Vue Plugin (Volar)**：Vue 3 + TypeScript 支持
- **Auto Rename Tag**：自动重命名配对标签
- **Bracket Pair Colorizer**：括号配对着色

## 项目结构建议

推荐的项目结构：

```
src/
├── components/
├── views/
├── stores/
│   ├── index.ts          # 导出所有 stores
│   ├── types.ts          # 类型定义
│   ├── auth.ts           # 认证相关
│   ├── user.ts           # 用户相关
│   └── product.ts        # 产品相关
├── api/
├── utils/
└── main.ts
```

### stores/index.ts

```typescript
// stores/index.ts
export { useAuthStore } from './auth'
export { useUserStore } from './user'
export { useProductStore } from './product'

// 类型导出
export type * from './types'
```

## 环境变量配置

您可以根据不同环境配置 Pinia：

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// 开发环境启用调试
if (import.meta.env.DEV) {
  pinia.use(({ store }) => {
    store.$subscribe((mutation, state) => {
      console.log('🍍 Pinia mutation:', mutation)
      console.log('🍍 New state:', state)
    })
  })
}

app.use(pinia)
app.mount('#app')
```

## 验证安装

创建一个简单的测试 store 来验证安装是否成功：

```javascript
// stores/test.js
import { defineStore } from 'pinia'

export const useTestStore = defineStore('test', {
  state: () => ({
    message: 'Pinia 安装成功！'
  })
})
```

```vue
<!-- App.vue -->
<template>
  <div>
    <h1>{{ testStore.message }}</h1>
  </div>
</template>

<script setup>
import { useTestStore } from '@/stores/test'

const testStore = useTestStore()
</script>
```

如果页面显示 "Pinia 安装成功！"，说明安装配置正确。

## 下一步

现在您已经成功安装了 Pinia，让我们继续学习：

- [快速开始](./getting-started) - 创建您的第一个 store
- [定义 Store](./defining-stores) - 深入了解 store 的定义方式
- [核心概念](./core-concepts) - 学习 State、Getters 和 Actions

准备好开始使用 Pinia 了吗？🚀