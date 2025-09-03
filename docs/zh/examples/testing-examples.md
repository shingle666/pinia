# Pinia Store 测试

使用各种测试框架测试 Pinia store 的综合示例和模式，包括单元测试、集成测试和端到端测试策略。

## 功能特性

- 🧪 使用 Vitest/Jest 进行单元测试
- 🔗 集成测试模式
- 🎭 使用 Playwright 进行端到端测试
- 🎯 模拟策略和最佳实践
- 📊 覆盖率报告和分析
- 🔄 测试异步操作和副作用
- 🛡️ 错误处理和边缘情况测试
- 🎨 测试 store 组合和依赖
- 📱 组件集成测试
- 🔧 自定义测试工具和助手

## 测试设置

### Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/main.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  }
})
```

### 测试设置文件

```typescript
// src/test/setup.ts
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

// 全局测试设置
beforeEach(() => {
  // 在每个测试前重置所有模拟
  vi.clearAllMocks()
  
  // 清除 localStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // 重置 fetch 模拟
  global.fetch = vi.fn()
})

// Vue Test Utils 全局配置
config.global.plugins = [createPinia()]

// 模拟 IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
}))

// 模拟 ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
}))

// 模拟 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
```

## 测试工具

### Store 测试助手

```typescript
// src/test/store-utils.ts
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { beforeEach, afterEach, vi } from 'vitest'
import type { App } from 'vue'
import { createApp } from 'vue'

export interface StoreTestContext {
  pinia: Pinia
  app: App
}

export function setupStoreTest(): StoreTestContext {
  let pinia: Pinia
  let app: App
  
  beforeEach(() => {
    app = createApp({})
    pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
  })
  
  afterEach(() => {
    vi.clearAllMocks()
    app.unmount()
  })
  
  return {
    get pinia() { return pinia },
    get app() { return app }
  }
}

export function createMockApi<T extends Record<string, any>>(methods: T): T {
  const mock = {} as T
  
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      mock[key as keyof T] = vi.fn(value) as T[keyof T]
    } else {
      mock[key as keyof T] = value
    }
  }
  
  return mock
}

export async function waitForStoreAction(
  fn: () => Promise<any>,
  timeout = 5000
): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Store 操作在 ${timeout}ms 后超时`)), timeout)
  })
  
  try {
    await Promise.race([fn(), timeoutPromise])
  } catch (error) {
    if (error instanceof Error && error.message.includes('超时')) {
      throw error
    }
    // 重新抛出 store 操作的原始错误
    throw error
  }
}

export function createMockResponse<T>(data: T, options: {
  status?: number
  statusText?: string
  headers?: Record<string, string>
} = {}): Response {
  const {
    status = 200,
    statusText = 'OK',
    headers = { 'Content-Type': 'application/json' }
  } = options
  
  return new Response(JSON.stringify(data), {
    status,
    statusText,
    headers
  })
}

export function mockFetch(responses: Array<{
  url: string | RegExp
  response: any
  status?: number
  delay?: number
}>): void {
  global.fetch = vi.fn().mockImplementation(async (url: string) => {
    const match = responses.find(r => 
      typeof r.url === 'string' ? r.url === url : r.url.test(url)
    )
    
    if (!match) {
      throw new Error(`未找到 URL 的模拟响应: ${url}`)
    }
    
    if (match.delay) {
      await new Promise(resolve => setTimeout(resolve, match.delay))
    }
    
    return createMockResponse(match.response, { status: match.status })
  })
}
```

### 组件测试助手

```typescript
// src/test/component-utils.ts
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'

export interface ComponentTestOptions {
  props?: Record<string, any>
  slots?: Record<string, any>
  global?: {
    plugins?: any[]
    mocks?: Record<string, any>
    stubs?: Record<string, any>
  }
}

export function mountWithPinia(
  component: Component,
  options: ComponentTestOptions = {}
): VueWrapper {
  const pinia = createPinia()
  setActivePinia(pinia)
  
  return mount(component, {
    ...options,
    global: {
      plugins: [pinia, ...(options.global?.plugins || [])],
      ...options.global
    }
  })
}

export async function waitForAsyncComponent(
  wrapper: VueWrapper,
  timeout = 1000
): Promise<void> {
  await wrapper.vm.$nextTick()
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`组件异步操作在 ${timeout}ms 后超时`))
    }, timeout)
    
    const checkComplete = () => {
      if (!wrapper.vm.$el.querySelector('[data-testid="loading"]')) {
        clearTimeout(timer)
        resolve()
      } else {
        setTimeout(checkComplete, 10)
      }
    }
    
    checkComplete()
  })
}
```

## 单元测试示例

### 测试基本 Store 操作

```typescript
// src/stores/__tests__/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCounterStore } from '@stores/counter'
import { setupStoreTest } from '@/test/store-utils'

describe('计数器 Store', () => {
  setupStoreTest()
  
  it('应该使用默认状态初始化', () => {
    const store = useCounterStore()
    
    expect(store.count).toBe(0)
    expect(store.doubleCount).toBe(0)
    expect(store.isEven).toBe(true)
  })
  
  it('应该递增计数', () => {
    const store = useCounterStore()
    
    store.increment()
    
    expect(store.count).toBe(1)
    expect(store.doubleCount).toBe(2)
    expect(store.isEven).toBe(false)
  })
  
  it('应该递减计数', () => {
    const store = useCounterStore()
    
    store.increment() // count = 1
    store.decrement() // count = 0
    
    expect(store.count).toBe(0)
    expect(store.isEven).toBe(true)
  })
  
  it('应该按自定义数量递增', () => {
    const store = useCounterStore()
    
    store.incrementBy(5)
    
    expect(store.count).toBe(5)
    expect(store.doubleCount).toBe(10)
  })
  
  it('应该重置计数', () => {
    const store = useCounterStore()
    
    store.incrementBy(10)
    store.reset()
    
    expect(store.count).toBe(0)
    expect(store.doubleCount).toBe(0)
  })
})
```

### 测试异步操作

```typescript
// src/stores/__tests__/todos.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTodosStore } from '@stores/todos'
import { setupStoreTest, createMockApi, waitForStoreAction } from '@/test/store-utils'
import type { Todo } from '@/types'

const mockTodosApi = createMockApi({
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn()
})

vi.mock('@/api/todos', () => ({
  todosApi: mockTodosApi
}))

describe('待办事项 Store', () => {
  setupStoreTest()
  
  const mockTodos: Todo[] = [
    {
      id: '1',
      title: '测试待办事项 1',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: '测试待办事项 2',
      completed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('应该成功获取待办事项', async () => {
    const store = useTodosStore()
    
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: mockTodos,
      message: '成功',
      success: true,
      timestamp: new Date()
    })
    
    await waitForStoreAction(() => store.fetchTodos())
    
    expect(store.todos).toEqual(mockTodos)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(mockTodosApi.fetchTodos).toHaveBeenCalledOnce()
  })
  
  it('应该处理获取待办事项错误', async () => {
    const store = useTodosStore()
    const error = new Error('网络错误')
    
    mockTodosApi.fetchTodos.mockRejectedValue(error)
    
    await expect(store.fetchTodos()).rejects.toThrow('网络错误')
    
    expect(store.todos).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.hasError).toBe(true)
    expect(store.error).toBe('网络错误')
  })
  
  it('应该使用乐观更新创建待办事项', async () => {
    const store = useTodosStore()
    const newTodo = {
      title: '新待办事项',
      completed: false
    }
    
    const createdTodo: Todo = {
      id: '3',
      ...newTodo,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockTodosApi.createTodo.mockResolvedValue({
      data: createdTodo,
      message: '已创建',
      success: true,
      timestamp: new Date()
    })
    
    // 检查乐观更新
    const createPromise = store.createTodo(newTodo)
    
    // 应该立即有临时待办事项
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].title).toBe(newTodo.title)
    expect(store.todos[0].id).toMatch(/^temp-/)
    
    await waitForStoreAction(() => createPromise)
    
    // 应该用真实的待办事项替换临时的
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toEqual(createdTodo)
    expect(mockTodosApi.createTodo).toHaveBeenCalledWith(newTodo)
  })
  
  it('应该在创建错误时回滚乐观更新', async () => {
    const store = useTodosStore()
    const newTodo = {
      title: '新待办事项',
      completed: false
    }
    
    mockTodosApi.createTodo.mockRejectedValue(new Error('创建失败'))
    
    const createPromise = store.createTodo(newTodo)
    
    // 应该有临时待办事项
    expect(store.todos).toHaveLength(1)
    
    await expect(createPromise).rejects.toThrow('创建失败')
    
    // 应该回滚到空状态
    expect(store.todos).toHaveLength(0)
    expect(store.hasError).toBe(true)
  })
  
  it('应该更新待办事项', async () => {
    const store = useTodosStore()
    
    // 设置初始状态
    store.$patch({ todos: [...mockTodos] })
    
    const updates = { completed: true }
    const updatedTodo = { ...mockTodos[0], ...updates, updatedAt: new Date() }
    
    mockTodosApi.updateTodo.mockResolvedValue({
      data: updatedTodo,
      message: '已更新',
      success: true,
      timestamp: new Date()
    })
    
    await waitForStoreAction(() => store.updateTodo('1', updates))
    
    expect(store.todos[0]).toEqual(updatedTodo)
    expect(mockTodosApi.updateTodo).toHaveBeenCalledWith('1', updates)
  })
  
  it('应该删除待办事项', async () => {
    const store = useTodosStore()
    
    // 设置初始状态
    store.$patch({ todos: [...mockTodos] })
    
    mockTodosApi.deleteTodo.mockResolvedValue({
      data: null,
      message: '已删除',
      success: true,
      timestamp: new Date()
    })
    
    await waitForStoreAction(() => store.deleteTodo('1'))
    
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].id).toBe('2')
    expect(mockTodosApi.deleteTodo).toHaveBeenCalledWith('1')
  })
  
  it('应该正确过滤待办事项', () => {
    const store = useTodosStore()
    
    store.$patch({ todos: [...mockTodos] })
    
    expect(store.completedTodos).toHaveLength(1)
    expect(store.completedTodos[0].id).toBe('2')
    
    expect(store.pendingTodos).toHaveLength(1)
    expect(store.pendingTodos[0].id).toBe('1')
    
    expect(store.completionRate).toBe(0.5)
  })
})
```

### 测试 Store 组合

```typescript
// src/stores/__tests__/user-profile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@stores/user'
import { useProfileStore } from '@stores/profile'
import { setupStoreTest, createMockApi } from '@/test/store-utils'

const mockUserApi = createMockApi({
  login: vi.fn(),
  logout: vi.fn()
})

const mockProfileApi = createMockApi({
  getProfile: vi.fn(),
  updateProfile: vi.fn()
})

vi.mock('@/api/user', () => ({ userApi: mockUserApi }))
vi.mock('@/api/profile', () => ({ profileApi: mockProfileApi }))

describe('Store 组合 - 用户资料', () => {
  setupStoreTest()
  
  it('应该在用户登录时同步资料数据', async () => {
    const userStore = useUserStore()
    const profileStore = useProfileStore()
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: '张',
      lastName: '三'
    }
    
    const mockProfile = {
      userId: '1',
      bio: '测试简介',
      avatar: 'avatar.jpg',
      preferences: {
        theme: 'dark',
        language: 'zh'
      }
    }
    
    mockUserApi.login.mockResolvedValue({
      data: { user: mockUser, token: 'token', expiresAt: new Date().toISOString() },
      message: '成功',
      success: true,
      timestamp: new Date()
    })
    
    mockProfileApi.getProfile.mockResolvedValue({
      data: mockProfile,
      message: '成功',
      success: true,
      timestamp: new Date()
    })
    
    await userStore.login({ email: 'test@example.com', password: 'password' })
    
    // 登录后应该自动获取资料
    expect(profileStore.profile).toEqual(mockProfile)
    expect(mockProfileApi.getProfile).toHaveBeenCalledWith('1')
  })
  
  it('应该在用户登出时清除资料数据', async () => {
    const userStore = useUserStore()
    const profileStore = useProfileStore()
    
    // 设置初始状态
    profileStore.$patch({
      profile: {
        userId: '1',
        bio: '测试简介',
        avatar: 'avatar.jpg',
        preferences: { theme: 'dark', language: 'zh' }
      }
    })
    
    await userStore.logout()
    
    expect(profileStore.profile).toBeNull()
  })
  
  it('应该处理资料更新并与用户 store 同步', async () => {
    const userStore = useUserStore()
    const profileStore = useProfileStore()
    
    // 设置初始状态
    userStore.$patch({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: '张',
        lastName: '三'
      },
      isAuthenticated: true
    })
    
    const updatedProfile = {
      userId: '1',
      bio: '更新的简介',
      avatar: 'new-avatar.jpg',
      preferences: { theme: 'light', language: 'en' }
    }
    
    mockProfileApi.updateProfile.mockResolvedValue({
      data: updatedProfile,
      message: '已更新',
      success: true,
      timestamp: new Date()
    })
    
    await profileStore.updateProfile({
      bio: '更新的简介',
      avatar: 'new-avatar.jpg'
    })
    
    expect(profileStore.profile).toEqual(updatedProfile)
    expect(userStore.user?.preferences).toEqual(updatedProfile.preferences)
  })
})
```

## 集成测试

### 测试组件-Store 集成

```typescript
// src/components/__tests__/TodoList.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountWithPinia, waitForAsyncComponent } from '@/test/component-utils'
import { createMockApi, mockFetch } from '@/test/store-utils'
import TodoList from '@/components/TodoList.vue'
import { useTodosStore } from '@stores/todos'

const mockTodosApi = createMockApi({
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn()
})

vi.mock('@/api/todos', () => ({
  todosApi: mockTodosApi
}))

describe('TodoList 组件集成', () => {
  const mockTodos = [
    {
      id: '1',
      title: '测试待办事项 1',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: '测试待办事项 2',
      completed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('应该从 store 渲染待办事项', async () => {
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: mockTodos,
      message: '成功',
      success: true,
      timestamp: new Date()
    })
    
    const wrapper = mountWithPinia(TodoList)
    await waitForAsyncComponent(wrapper)
    
    const todoItems = wrapper.findAll('[data-testid="todo-item"]')
    expect(todoItems).toHaveLength(2)
    
    expect(todoItems[0].text()).toContain('测试待办事项 1')
    expect(todoItems[1].text()).toContain('测试待办事项 2')
  })
  
  it('应该在表单提交时创建新待办事项', async () => {
    const newTodo = {
      id: '3',
      title: '新待办事项',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: [],
      message: '成功',
      success: true,
      timestamp: new Date()
    })
    
    mockTodosApi.createTodo.mockResolvedValue({
      data: newTodo,
      message: '已创建',
      success: true,
      timestamp: new Date()
    })
    
    const wrapper = mountWithPinia(TodoList)
    await waitForAsyncComponent(wrapper)
    
    const input = wrapper.find('[data-testid="todo-input"]')
    const form = wrapper.find('[data-testid="todo-form"]')
    
    await input.setValue('新待办事项')
    await form.trigger('submit')
    
    expect(mockTodosApi.createTodo).toHaveBeenCalledWith({
      title: '新待办事项',
      completed: false
    })
  })
  
  it('应该切换待办事项完成状态', async () => {
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: mockTodos,
      message: '成功',
      success: true,
      timestamp: new Date()
    })
    
    mockTodosApi.updateTodo.mockResolvedValue({
      data: { ...mockTodos[0], completed: true },
      message: '已更新',
      success: true,
      timestamp: new Date()
    })
    
    const wrapper = mountWithPinia(TodoList)
    await waitForAsyncComponent(wrapper)
    
    const checkbox = wrapper.find('[data-testid="todo-checkbox-1"]')
    await checkbox.setChecked(true)
    
    expect(mockTodosApi.updateTodo).toHaveBeenCalledWith('1', {
      completed: true
    })
  })
  
  it('应该显示加载状态', async () => {
    // 模拟慢速 API 响应
    mockTodosApi.fetchTodos.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: mockTodos,
          message: '成功',
          success: true,
          timestamp: new Date()
        }), 100)
      )
    )
    
    const wrapper = mountWithPinia(TodoList)
    
    // 初始应该显示加载
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    
    await waitForAsyncComponent(wrapper)
    
    // 数据加载后应该隐藏加载
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
  })
  
  it('应该显示错误状态', async () => {
    mockTodosApi.fetchTodos.mockRejectedValue(new Error('网络错误'))
    
    const wrapper = mountWithPinia(TodoList)
    await waitForAsyncComponent(wrapper)
    
    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error"]').text()).toContain('网络错误')
  })
})
```

### 测试 Store 持久化

```typescript
// src/stores/__tests__/persistence.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useUserStore } from '@stores/user'
import { setupStoreTest } from '@/test/store-utils'

describe('Store 持久化', () => {
  setupStoreTest()
  
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  it('应该将用户数据持久化到 localStorage', () => {
    const store = useUserStore()
    
    const userData = {
      id: '1',
      email: 'test@example.com',
      firstName: '张',
      lastName: '三'
    }
    
    store.$patch({ user: userData, isAuthenticated: true })
    
    const stored = localStorage.getItem('user-store')
    expect(stored).toBeTruthy()
    
    const parsed = JSON.parse(stored!)
    expect(parsed.user).toEqual(userData)
    expect(parsed.isAuthenticated).toBe(true)
  })
  
  it('应该从 localStorage 恢复用户数据', () => {
    const userData = {
      id: '1',
      email: 'test@example.com',
      firstName: '张',
      lastName: '三'
    }
    
    localStorage.setItem('user-store', JSON.stringify({
      user: userData,
      isAuthenticated: true
    }))
    
    const store = useUserStore()
    
    expect(store.user).toEqual(userData)
    expect(store.isAuthenticated).toBe(true)
  })
  
  it('应该处理损坏的 localStorage 数据', () => {
    localStorage.setItem('user-store', 'invalid-json')
    
    const store = useUserStore()
    
    // 应该回退到默认状态
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
  
  it('应该在登出时清除持久化', async () => {
    const store = useUserStore()
    
    store.$patch({
      user: { id: '1', email: 'test@example.com' },
      isAuthenticated: true
    })
    
    expect(localStorage.getItem('user-store')).toBeTruthy()
    
    await store.logout()
    
    expect(localStorage.getItem('user-store')).toBeNull()
  })
})
```

## 端到端测试

### Playwright E2E 测试

```typescript
// tests/e2e/todos.spec.ts
import { test, expect } from '@playwright/test'

test.describe('待办事项应用 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })
  
  test('应该创建和管理待办事项', async ({ page }) => {
    // 创建新待办事项
    await page.fill('[data-testid="todo-input"]', '买菜')
    await page.click('[data-testid="add-todo-btn"]')
    
    // 验证待办事项出现在列表中
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('买菜')
    
    // 标记待办事项为已完成
    await page.check('[data-testid="todo-checkbox"]')
    
    // 验证待办事项被标记为已完成
    await expect(page.locator('[data-testid="todo-item"]')).toHaveClass(/completed/)
    
    // 删除待办事项
    await page.click('[data-testid="delete-todo-btn"]')
    
    // 验证待办事项被移除
    await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(0)
  })
  
  test('应该在页面重新加载后保持待办事项', async ({ page }) => {
    // 创建待办事项
    await page.fill('[data-testid="todo-input"]', '持久化待办事项')
    await page.click('[data-testid="add-todo-btn"]')
    
    // 重新加载页面
    await page.reload()
    
    // 验证待办事项持久化
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('持久化待办事项')
  })
  
  test('应该正确过滤待办事项', async ({ page }) => {
    // 创建多个待办事项
    await page.fill('[data-testid="todo-input"]', '待办事项 1')
    await page.click('[data-testid="add-todo-btn"]')
    
    await page.fill('[data-testid="todo-input"]', '待办事项 2')
    await page.click('[data-testid="add-todo-btn"]')
    
    // 标记第一个待办事项为已完成
    await page.check('[data-testid="todo-checkbox"]:first-child')
    
    // 按已完成过滤
    await page.click('[data-testid="filter-completed"]')
    
    // 应该只显示已完成的待办事项
    await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('待办事项 1')
    
    // 按活跃过滤
    await page.click('[data-testid="filter-active"]')
    
    // 应该只显示活跃的待办事项
    await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('待办事项 2')
  })
  
  test('应该优雅地处理网络错误', async ({ page }) => {
    // 拦截 API 调用并模拟网络错误
    await page.route('**/api/todos', route => {
      route.abort('failed')
    })
    
    await page.goto('/')
    
    // 应该显示错误消息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    
    // 应该显示重试按钮
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
  })
})
```

## 性能测试

### Store 性能测试

```typescript
// src/stores/__tests__/performance.test.ts
import { describe, it, expect } from 'vitest'
import { useProductsStore } from '@stores/products'
import { setupStoreTest } from '@/test/store-utils'

describe('Store 性能', () => {
  setupStoreTest()
  
  it('应该高效处理大型数据集', () => {
    const store = useProductsStore()
    
    // 生成大型数据集
    const products = Array.from({ length: 10000 }, (_, i) => ({
      id: `product-${i}`,
      name: `产品 ${i}`,
      price: Math.random() * 100,
      category: `分类 ${i % 10}`,
      inStock: Math.random() > 0.5
    }))
    
    const start = performance.now()
    
    store.$patch({ products })
    
    const patchTime = performance.now() - start
    
    // 应该快速修补大型数据集（< 100ms）
    expect(patchTime).toBeLessThan(100)
    
    const filterStart = performance.now()
    
    // 测试过滤性能
    store.setFilters({ category: '分类 1', inStock: true })
    const filtered = store.filteredProducts
    
    const filterTime = performance.now() - filterStart
    
    // 应该快速过滤（< 50ms）
    expect(filterTime).toBeLessThan(50)
    expect(filtered.length).toBeGreaterThan(0)
  })
  
  it('应该防抖搜索操作', async () => {
    const store = useProductsStore()
    
    let searchCallCount = 0
    const originalSearch = store.searchProducts
    
    store.searchProducts = (...args) => {
      searchCallCount++
      return originalSearch.apply(store, args)
    }
    
    // 快速搜索调用
    store.searchProducts('test')
    store.searchProducts('test1')
    store.searchProducts('test12')
    store.searchProducts('test123')
    
    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // 由于防抖，应该只调用一次搜索
    expect(searchCallCount).toBe(1)
  })
})
```

## 覆盖率和报告

### 覆盖率配置

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:coverage:ui": "vitest --coverage --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 自定义测试报告器

```typescript
// src/test/reporter.ts
import type { Reporter } from 'vitest'

export class StoreTestReporter implements Reporter {
  onInit() {
    console.log('🧪 开始 Pinia store 测试...')
  }
  
  onFinished(files, errors) {
    const storeTests = files.filter(file => 
      file.name.includes('stores/__tests__')
    )
    
    const totalStoreTests = storeTests.reduce(
      (acc, file) => acc + (file.result?.numTotalTests || 0),
      0
    )
    
    const passedStoreTests = storeTests.reduce(
      (acc, file) => acc + (file.result?.numPassedTests || 0),
      0
    )
    
    console.log(`\n📊 Store 测试摘要:`)
    console.log(`   总 store 测试数: ${totalStoreTests}`)
    console.log(`   通过: ${passedStoreTests}`)
    console.log(`   失败: ${totalStoreTests - passedStoreTests}`)
    
    if (errors.length > 0) {
      console.log(`\n❌ 错误: ${errors.length}`)
    }
  }
}
```

这个综合测试指南提供了彻底测试 Pinia store 的模式和示例，从基本单元测试到复杂的集成场景和端到端测试策略。