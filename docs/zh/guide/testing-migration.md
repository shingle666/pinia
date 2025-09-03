---
title: 测试迁移指南
description: 学习如何在从 Vuex 迁移到 Pinia 的过程中维护和改进测试策略，确保代码质量和功能完整性。
head:
  - [meta, { name: description, content: "学习如何在从 Vuex 迁移到 Pinia 的过程中维护和改进测试策略，确保代码质量和功能完整性。" }]
  - [meta, { name: keywords, content: "Pinia 测试, Vuex 迁移测试, 单元测试, 集成测试" }]
  - [meta, { property: "og:title", content: "测试迁移指南 - Pinia" }]
  - [meta, { property: "og:description", content: "学习如何在从 Vuex 迁移到 Pinia 的过程中维护和改进测试策略，确保代码质量和功能完整性。" }]
---

# 测试迁移指南

本指南帮助您在从 Vuex 迁移到 Pinia 的过程中维护和改进测试策略，确保迁移过程中的代码质量和功能完整性。

## 概述

测试迁移是整个状态管理迁移过程中的关键环节，需要考虑：

- 现有 Vuex 测试的维护
- 新 Pinia 测试的编写
- 迁移过程中的并行测试
- 测试工具和框架的适配
- 测试覆盖率的保持

## 测试环境设置

### 1. 基础测试配置

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
})
```

```ts
// tests/setup.ts
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createStore } from 'vuex'

// 全局测试设置
beforeEach(() => {
  // 为每个测试创建新的 Pinia 实例
  setActivePinia(createPinia())
})

// 配置 Vue Test Utils
config.global.plugins = [
  createPinia(),
  // 如果需要，也可以添加 Vuex store
]
```

### 2. 测试工具函数

```ts
// tests/utils/test-helpers.ts
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createStore, type Store } from 'vuex'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'

// Pinia 测试助手
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// Vuex 测试助手
export function createTestVuexStore(modules: any = {}): Store<any> {
  return createStore({
    modules,
    strict: false // 测试环境中关闭严格模式
  })
}

// 组件挂载助手
export function mountWithStores(
  component: Component,
  options: {
    pinia?: Pinia
    vuexStore?: Store<any>
    props?: Record<string, any>
    [key: string]: any
  } = {}
): VueWrapper {
  const { pinia = createTestPinia(), vuexStore, props, ...mountOptions } = options
  
  const plugins = [pinia]
  if (vuexStore) {
    plugins.push(vuexStore)
  }
  
  return mount(component, {
    props,
    global: {
      plugins,
      ...mountOptions.global
    },
    ...mountOptions
  })
}

// 异步操作等待助手
export async function waitForStoreAction(
  action: () => Promise<any>,
  timeout: number = 1000
): Promise<void> {
  const start = Date.now()
  
  await action()
  
  // 等待所有微任务完成
  await new Promise(resolve => setTimeout(resolve, 0))
  
  if (Date.now() - start > timeout) {
    throw new Error(`Store action timeout after ${timeout}ms`)
  }
}
```

## Vuex 测试迁移

### 1. 现有 Vuex 测试模式

```ts
// tests/store/user.test.ts (Vuex 版本)
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'

describe('User Store (Vuex)', () => {
  let store: any
  
  beforeEach(() => {
    store = createStore({
      modules: {
        user: {
          ...userModule,
          namespaced: true
        }
      }
    })
  })
  
  describe('mutations', () => {
    it('should set user', () => {
      const user = { id: 1, name: 'John Doe' }
      store.commit('user/SET_USER', user)
      
      expect(store.state.user.user).toEqual(user)
      expect(store.getters['user/isLoggedIn']).toBe(true)
    })
    
    it('should clear user on logout', () => {
      store.commit('user/SET_USER', { id: 1, name: 'John Doe' })
      store.commit('user/LOGOUT')
      
      expect(store.state.user.user).toBeNull()
      expect(store.getters['user/isLoggedIn']).toBe(false)
    })
  })
  
  describe('actions', () => {
    it('should login user', async () => {
      const mockApi = vi.fn().mockResolvedValue({ id: 1, name: 'John Doe' })
      
      // 模拟 API
      vi.doMock('@/api/auth', () => ({ login: mockApi }))
      
      await store.dispatch('user/login', { email: 'test@example.com', password: 'password' })
      
      expect(mockApi).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' })
      expect(store.getters['user/isLoggedIn']).toBe(true)
    })
  })
})
```

### 2. 转换为 Pinia 测试

```ts
// tests/stores/user.test.ts (Pinia 版本)
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { createTestPinia } from '../utils/test-helpers'

// 模拟 API
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn()
}))

import { login as mockLogin } from '@/api/auth'

describe('User Store (Pinia)', () => {
  beforeEach(() => {
    createTestPinia()
    vi.clearAllMocks()
  })
  
  describe('state management', () => {
    it('should initialize with default state', () => {
      const store = useUserStore()
      
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
    })
    
    it('should update user state', () => {
      const store = useUserStore()
      const user = { id: 1, name: 'John Doe', email: 'john@example.com' }
      
      // 直接修改状态（Pinia 允许）
      store.$patch({ user })
      
      expect(store.user).toEqual(user)
      expect(store.isLoggedIn).toBe(true)
      expect(store.fullName).toBe('John Doe')
    })
  })
  
  describe('actions', () => {
    it('should login user successfully', async () => {
      const store = useUserStore()
      const credentials = { email: 'test@example.com', password: 'password' }
      const userData = { id: 1, name: 'John', lastName: 'Doe', email: 'test@example.com' }
      
      ;(mockLogin as any).mockResolvedValue(userData)
      
      await store.login(credentials)
      
      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(store.user).toEqual(userData)
      expect(store.isLoggedIn).toBe(true)
    })
    
    it('should handle login error', async () => {
      const store = useUserStore()
      const error = new Error('Invalid credentials')
      
      ;(mockLogin as any).mockRejectedValue(error)
      
      await expect(store.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials')
      
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
    })
    
    it('should logout user', () => {
      const store = useUserStore()
      
      // 先设置用户
      store.$patch({ user: { id: 1, name: 'John Doe' } })
      expect(store.isLoggedIn).toBe(true)
      
      // 执行登出
      store.logout()
      
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
    })
  })
  
  describe('getters', () => {
    it('should compute full name correctly', () => {
      const store = useUserStore()
      
      store.$patch({
        user: { id: 1, firstName: 'John', lastName: 'Doe' }
      })
      
      expect(store.fullName).toBe('John Doe')
    })
    
    it('should return empty string for full name when no user', () => {
      const store = useUserStore()
      
      expect(store.fullName).toBe('')
    })
  })
})
```

## 并行测试策略

### 1. 功能对等测试

确保 Vuex 和 Pinia 实现产生相同的结果。

```ts
// tests/migration/parity.test.ts
import { createStore } from 'vuex'
import { setActivePinia, createPinia } from 'pinia'
import userVuexModule from '@/store/modules/user'
import { useUserStore } from '@/stores/user'

describe('Vuex-Pinia 功能对等测试', () => {
  let vuexStore: any
  let piniaStore: any
  
  beforeEach(() => {
    // 设置 Vuex
    vuexStore = createStore({
      modules: {
        user: { ...userVuexModule, namespaced: true }
      }
    })
    
    // 设置 Pinia
    setActivePinia(createPinia())
    piniaStore = useUserStore()
  })
  
  describe('用户登录功能', () => {
    const testUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
    
    it('应该在两个实现中产生相同的登录状态', () => {
      // Vuex 操作
      vuexStore.commit('user/SET_USER', testUser)
      
      // Pinia 操作
      piniaStore.$patch({ user: testUser })
      
      // 验证状态一致
      expect(vuexStore.getters['user/isLoggedIn']).toBe(piniaStore.isLoggedIn)
      expect(vuexStore.getters['user/fullName']).toBe(piniaStore.fullName)
      expect(vuexStore.state.user.user).toEqual(piniaStore.user)
    })
    
    it('应该在两个实现中产生相同的登出状态', () => {
      // 先设置用户
      vuexStore.commit('user/SET_USER', testUser)
      piniaStore.$patch({ user: testUser })
      
      // 执行登出
      vuexStore.commit('user/LOGOUT')
      piniaStore.logout()
      
      // 验证状态一致
      expect(vuexStore.getters['user/isLoggedIn']).toBe(piniaStore.isLoggedIn)
      expect(vuexStore.state.user.user).toEqual(piniaStore.user)
    })
  })
})
```

### 2. 渐进式测试覆盖

```ts
// tests/migration/coverage.test.ts
import { describe, it, expect } from 'vitest'
import { migrationHelper } from '@/utils/migration-helper'

describe('迁移覆盖率测试', () => {
  it('应该跟踪迁移进度', () => {
    migrationHelper.markAsMigrated('user')
    migrationHelper.markAsMigrated('cart')
    
    const status = migrationHelper.getMigrationStatus()
    
    expect(status.migrated).toContain('user')
    expect(status.migrated).toContain('cart')
    expect(status.total).toBe(2)
  })
  
  it('应该检测未迁移的模块', () => {
    expect(migrationHelper.isMigrated('products')).toBe(false)
    expect(migrationHelper.isMigrated('orders')).toBe(false)
  })
})
```

## 组件测试迁移

### 1. Vuex 组件测试

```ts
// tests/components/UserProfile.vuex.test.ts
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import UserProfile from '@/components/UserProfile.vue'
import userModule from '@/store/modules/user'

describe('UserProfile (Vuex)', () => {
  let store: any
  
  beforeEach(() => {
    store = createStore({
      modules: {
        user: { ...userModule, namespaced: true }
      }
    })
  })
  
  it('should display user information', () => {
    const user = { id: 1, firstName: 'John', lastName: 'Doe' }
    store.commit('user/SET_USER', user)
    
    const wrapper = mount(UserProfile, {
      global: {
        plugins: [store]
      }
    })
    
    expect(wrapper.text()).toContain('John Doe')
  })
  
  it('should handle logout', async () => {
    const user = { id: 1, firstName: 'John', lastName: 'Doe' }
    store.commit('user/SET_USER', user)
    
    const wrapper = mount(UserProfile, {
      global: {
        plugins: [store]
      }
    })
    
    await wrapper.find('[data-testid="logout-button"]').trigger('click')
    
    expect(store.getters['user/isLoggedIn']).toBe(false)
  })
})
```

### 2. Pinia 组件测试

```ts
// tests/components/UserProfile.pinia.test.ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserProfile from '@/components/UserProfile.vue'
import { useUserStore } from '@/stores/user'

describe('UserProfile (Pinia)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should display user information', () => {
    const wrapper = mount(UserProfile, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    const store = useUserStore()
    store.$patch({
      user: { id: 1, firstName: 'John', lastName: 'Doe' }
    })
    
    expect(wrapper.text()).toContain('John Doe')
  })
  
  it('should handle logout', async () => {
    const wrapper = mount(UserProfile, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    const store = useUserStore()
    store.$patch({
      user: { id: 1, firstName: 'John', lastName: 'Doe' }
    })
    
    await wrapper.find('[data-testid="logout-button"]').trigger('click')
    
    expect(store.isLoggedIn).toBe(false)
  })
})
```

### 3. 混合组件测试

```ts
// tests/components/MixedComponent.test.ts
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createPinia } from 'pinia'
import MixedComponent from '@/components/MixedComponent.vue'
import productsModule from '@/store/modules/products'
import { useUserStore } from '@/stores/user'

describe('MixedComponent (Vuex + Pinia)', () => {
  it('should work with both Vuex and Pinia', () => {
    const vuexStore = createStore({
      modules: {
        products: { ...productsModule, namespaced: true }
      }
    })
    
    const pinia = createPinia()
    
    const wrapper = mount(MixedComponent, {
      global: {
        plugins: [vuexStore, pinia]
      }
    })
    
    // 测试 Vuex 部分
    vuexStore.commit('products/SET_PRODUCTS', [{ id: 1, name: 'Product 1' }])
    
    // 测试 Pinia 部分
    const userStore = useUserStore()
    userStore.$patch({ user: { id: 1, name: 'John Doe' } })
    
    expect(wrapper.text()).toContain('Product 1')
    expect(wrapper.text()).toContain('John Doe')
  })
})
```

## 集成测试

### 1. 端到端测试

```ts
// tests/e2e/user-flow.test.ts
import { test, expect } from '@playwright/test'

test.describe('用户流程测试', () => {
  test('完整的用户登录流程', async ({ page }) => {
    await page.goto('/login')
    
    // 填写登录表单
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-button"]')
    
    // 验证登录成功
    await expect(page.locator('[data-testid="user-name"]')).toContainText('John Doe')
    
    // 测试购物车功能（可能使用不同的状态管理）
    await page.click('[data-testid="add-to-cart"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // 测试登出
    await page.click('[data-testid="logout-button"]')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })
})
```

### 2. API 集成测试

```ts
// tests/integration/api.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// 模拟 API 服务器
const server = setupServer(
  rest.post('/api/login', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      })
    )
  }),
  
  rest.post('/api/logout', (req, res, ctx) => {
    return res(ctx.status(200))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('API 集成测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should integrate with real API endpoints', async () => {
    const store = useUserStore()
    
    await store.login({
      email: 'john@example.com',
      password: 'password'
    })
    
    expect(store.user).toEqual({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    })
    expect(store.isLoggedIn).toBe(true)
  })
})
```

## 性能测试

### 1. 状态管理性能对比

```ts
// tests/performance/state-management.test.ts
import { describe, it, expect } from 'vitest'
import { createStore } from 'vuex'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import userModule from '@/store/modules/user'

describe('状态管理性能测试', () => {
  it('should compare Vuex vs Pinia performance', () => {
    const iterations = 10000
    
    // Vuex 性能测试
    const vuexStore = createStore({
      modules: { user: { ...userModule, namespaced: true } }
    })
    
    const vuexStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      vuexStore.commit('user/SET_USER', { id: i, name: `User ${i}` })
    }
    const vuexEnd = performance.now()
    
    // Pinia 性能测试
    setActivePinia(createPinia())
    const piniaStore = useUserStore()
    
    const piniaStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      piniaStore.$patch({ user: { id: i, name: `User ${i}` } })
    }
    const piniaEnd = performance.now()
    
    console.log(`Vuex: ${vuexEnd - vuexStart}ms`)
    console.log(`Pinia: ${piniaEnd - piniaStart}ms`)
    
    // Pinia 通常应该更快或相当
    expect(piniaEnd - piniaStart).toBeLessThanOrEqual((vuexEnd - vuexStart) * 1.1)
  })
})
```

### 2. 内存使用测试

```ts
// tests/performance/memory.test.ts
import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('内存使用测试', () => {
  it('should not leak memory during store operations', () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    // 创建和销毁多个 store 实例
    for (let i = 0; i < 1000; i++) {
      setActivePinia(createPinia())
      const store = useUserStore()
      store.$patch({ user: { id: i, name: `User ${i}` } })
    }
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // 内存增长应该在合理范围内
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
  })
})
```

## 测试自动化

### 1. 迁移测试脚本

```bash
#!/bin/bash
# scripts/test-migration.sh

echo "🧪 开始迁移测试..."

# 运行 Vuex 测试
echo "📦 测试 Vuex 实现..."
npm run test:vuex

# 运行 Pinia 测试
echo "🍍 测试 Pinia 实现..."
npm run test:pinia

# 运行对等测试
echo "⚖️ 运行功能对等测试..."
npm run test:parity

# 运行集成测试
echo "🔗 运行集成测试..."
npm run test:integration

# 生成覆盖率报告
echo "📊 生成测试覆盖率报告..."
npm run test:coverage

echo "✅ 迁移测试完成！"
```

### 2. CI/CD 配置

```yaml
# .github/workflows/migration-tests.yml
name: Migration Tests

on:
  push:
    branches: [main, migration/*]
  pull_request:
    branches: [main]

jobs:
  test-migration:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Vuex tests
        run: npm run test:vuex
      
      - name: Run Pinia tests
        run: npm run test:pinia
      
      - name: Run parity tests
        run: npm run test:parity
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 测试最佳实践

### 1. 测试组织

```
tests/
├── unit/
│   ├── stores/          # Pinia store 测试
│   ├── store/           # Vuex store 测试
│   └── components/      # 组件测试
├── integration/
│   ├── api.test.ts      # API 集成测试
│   └── stores.test.ts   # Store 集成测试
├── migration/
│   ├── parity.test.ts   # 功能对等测试
│   └── coverage.test.ts # 迁移覆盖率测试
├── performance/
│   ├── state-management.test.ts
│   └── memory.test.ts
├── e2e/
│   └── user-flows.test.ts
└── utils/
    └── test-helpers.ts
```

### 2. 测试命名约定

```ts
// 清晰的测试描述
describe('UserStore (Pinia)', () => {
  describe('when user logs in', () => {
    it('should set user data and isLoggedIn to true', () => {
      // 测试实现
    })
    
    it('should trigger login success event', () => {
      // 测试实现
    })
  })
  
  describe('when login fails', () => {
    it('should keep user as null and isLoggedIn as false', () => {
      // 测试实现
    })
    
    it('should set error message', () => {
      // 测试实现
    })
  })
})
```

### 3. 模拟和存根

```ts
// tests/mocks/api.ts
export const mockApi = {
  login: vi.fn(),
  logout: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn()
}

// 在测试中使用
vi.mock('@/api/auth', () => mockApi)

// 重置模拟
beforeEach(() => {
  vi.clearAllMocks()
})
```

## 测试覆盖率监控

### 1. 覆盖率配置

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### 2. 覆盖率报告

```ts
// scripts/coverage-report.ts
import fs from 'fs'
import path from 'path'

interface CoverageData {
  vuex: number
  pinia: number
  migration: number
}

function generateMigrationCoverageReport(): CoverageData {
  const vuexCoverage = calculateVuexCoverage()
  const piniaCoverage = calculatePiniaCoverage()
  const migrationCoverage = calculateMigrationCoverage()
  
  const report = {
    vuex: vuexCoverage,
    pinia: piniaCoverage,
    migration: migrationCoverage
  }
  
  fs.writeFileSync(
    path.join(process.cwd(), 'coverage/migration-report.json'),
    JSON.stringify(report, null, 2)
  )
  
  return report
}

function calculateVuexCoverage(): number {
  // 计算 Vuex 相关代码的测试覆盖率
  return 0
}

function calculatePiniaCoverage(): number {
  // 计算 Pinia 相关代码的测试覆盖率
  return 0
}

function calculateMigrationCoverage(): number {
  // 计算迁移相关代码的测试覆盖率
  return 0
}
```

## 常见问题和解决方案

### Q: 如何测试异步 actions？

**A**: 使用 `async/await` 和适当的模拟：

```ts
it('should handle async login', async () => {
  const store = useUserStore()
  const mockUser = { id: 1, name: 'John' }
  
  mockApi.login.mockResolvedValue(mockUser)
  
  await store.login({ email: 'test@example.com', password: 'password' })
  
  expect(store.user).toEqual(mockUser)
})
```

### Q: 如何测试 store 之间的交互？

**A**: 在测试中使用多个 store：

```ts
it('should update cart when user logs out', () => {
  const userStore = useUserStore()
  const cartStore = useCartStore()
  
  // 设置初始状态
  cartStore.addItem({ id: 1, name: 'Product' })
  userStore.$patch({ user: { id: 1, name: 'John' } })
  
  // 执行登出
  userStore.logout()
  
  // 验证购物车被清空
  expect(cartStore.items).toHaveLength(0)
})
```

### Q: 如何测试 SSR 场景？

**A**: 模拟服务端环境：

```ts
it('should work in SSR environment', () => {
  // 模拟服务端环境
  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true
  })
  
  const store = useUserStore()
  
  // 测试服务端逻辑
  expect(store.$isServer).toBe(true)
})
```

## 总结

测试迁移是确保从 Vuex 到 Pinia 平滑过渡的关键环节。通过：

1. **并行测试** - 同时维护 Vuex 和 Pinia 测试
2. **功能对等** - 确保两种实现产生相同结果
3. **渐进式覆盖** - 逐步提高 Pinia 测试覆盖率
4. **自动化验证** - 使用 CI/CD 持续验证迁移质量

您可以确保迁移过程中的代码质量和功能完整性。

## 相关资源

- [迁移指南](./migration.md)
- [Vuex 兼容性](./vuex-compatibility.md)
- [测试指南](./testing.md)
- [性能优化](./performance.md)