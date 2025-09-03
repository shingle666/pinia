# Testing Pinia Stores

Comprehensive examples and patterns for testing Pinia stores with various testing frameworks, including unit tests, integration tests, and end-to-end testing strategies.

## Features

- 🧪 Unit testing with Vitest/Jest
- 🔗 Integration testing patterns
- 🎭 End-to-end testing with Playwright
- 🎯 Mocking strategies and best practices
- 📊 Coverage reporting and analysis
- 🔄 Testing async operations and side effects
- 🛡️ Error handling and edge case testing
- 🎨 Testing store composition and dependencies
- 📱 Component integration testing
- 🔧 Custom testing utilities and helpers

## Testing Setup

### Vitest Configuration

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

### Test Setup File

```typescript
// src/test/setup.ts
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Clear localStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset fetch mock
  global.fetch = vi.fn()
})

// Vue Test Utils global config
config.global.plugins = [createPinia()]

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
}))

// Mock window.matchMedia
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

## Testing Utilities

### Store Testing Helpers

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
    setTimeout(() => reject(new Error(`Store action timed out after ${timeout}ms`)), timeout)
  })
  
  try {
    await Promise.race([fn(), timeoutPromise])
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      throw error
    }
    // Re-throw the original error from the store action
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
      throw new Error(`No mock response found for URL: ${url}`)
    }
    
    if (match.delay) {
      await new Promise(resolve => setTimeout(resolve, match.delay))
    }
    
    return createMockResponse(match.response, { status: match.status })
  })
}
```

### Component Testing Helpers

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
      reject(new Error(`Component async operation timed out after ${timeout}ms`))
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

## Unit Testing Examples

### Testing Basic Store Operations

```typescript
// src/stores/__tests__/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCounterStore } from '@stores/counter'
import { setupStoreTest } from '@/test/store-utils'

describe('Counter Store', () => {
  setupStoreTest()
  
  it('should initialize with default state', () => {
    const store = useCounterStore()
    
    expect(store.count).toBe(0)
    expect(store.doubleCount).toBe(0)
    expect(store.isEven).toBe(true)
  })
  
  it('should increment count', () => {
    const store = useCounterStore()
    
    store.increment()
    
    expect(store.count).toBe(1)
    expect(store.doubleCount).toBe(2)
    expect(store.isEven).toBe(false)
  })
  
  it('should decrement count', () => {
    const store = useCounterStore()
    
    store.increment() // count = 1
    store.decrement() // count = 0
    
    expect(store.count).toBe(0)
    expect(store.isEven).toBe(true)
  })
  
  it('should increment by custom amount', () => {
    const store = useCounterStore()
    
    store.incrementBy(5)
    
    expect(store.count).toBe(5)
    expect(store.doubleCount).toBe(10)
  })
  
  it('should reset count', () => {
    const store = useCounterStore()
    
    store.incrementBy(10)
    store.reset()
    
    expect(store.count).toBe(0)
    expect(store.doubleCount).toBe(0)
  })
})
```

### Testing Async Operations

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

describe('Todos Store', () => {
  setupStoreTest()
  
  const mockTodos: Todo[] = [
    {
      id: '1',
      title: 'Test Todo 1',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Test Todo 2',
      completed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should fetch todos successfully', async () => {
    const store = useTodosStore()
    
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: mockTodos,
      message: 'Success',
      success: true,
      timestamp: new Date()
    })
    
    await waitForStoreAction(() => store.fetchTodos())
    
    expect(store.todos).toEqual(mockTodos)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(mockTodosApi.fetchTodos).toHaveBeenCalledOnce()
  })
  
  it('should handle fetch todos error', async () => {
    const store = useTodosStore()
    const error = new Error('Network error')
    
    mockTodosApi.fetchTodos.mockRejectedValue(error)
    
    await expect(store.fetchTodos()).rejects.toThrow('Network error')
    
    expect(store.todos).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.hasError).toBe(true)
    expect(store.error).toBe('Network error')
  })
  
  it('should create todo with optimistic update', async () => {
    const store = useTodosStore()
    const newTodo = {
      title: 'New Todo',
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
      message: 'Created',
      success: true,
      timestamp: new Date()
    })
    
    // Check optimistic update
    const createPromise = store.createTodo(newTodo)
    
    // Should have temporary todo immediately
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].title).toBe(newTodo.title)
    expect(store.todos[0].id).toMatch(/^temp-/)
    
    await waitForStoreAction(() => createPromise)
    
    // Should replace temporary todo with real one
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toEqual(createdTodo)
    expect(mockTodosApi.createTodo).toHaveBeenCalledWith(newTodo)
  })
  
  it('should rollback optimistic update on create error', async () => {
    const store = useTodosStore()
    const newTodo = {
      title: 'New Todo',
      completed: false
    }
    
    mockTodosApi.createTodo.mockRejectedValue(new Error('Create failed'))
    
    const createPromise = store.createTodo(newTodo)
    
    // Should have temporary todo
    expect(store.todos).toHaveLength(1)
    
    await expect(createPromise).rejects.toThrow('Create failed')
    
    // Should rollback to empty state
    expect(store.todos).toHaveLength(0)
    expect(store.hasError).toBe(true)
  })
  
  it('should update todo', async () => {
    const store = useTodosStore()
    
    // Setup initial state
    store.$patch({ todos: [...mockTodos] })
    
    const updates = { completed: true }
    const updatedTodo = { ...mockTodos[0], ...updates, updatedAt: new Date() }
    
    mockTodosApi.updateTodo.mockResolvedValue({
      data: updatedTodo,
      message: 'Updated',
      success: true,
      timestamp: new Date()
    })
    
    await waitForStoreAction(() => store.updateTodo('1', updates))
    
    expect(store.todos[0]).toEqual(updatedTodo)
    expect(mockTodosApi.updateTodo).toHaveBeenCalledWith('1', updates)
  })
  
  it('should delete todo', async () => {
    const store = useTodosStore()
    
    // Setup initial state
    store.$patch({ todos: [...mockTodos] })
    
    mockTodosApi.deleteTodo.mockResolvedValue({
      data: null,
      message: 'Deleted',
      success: true,
      timestamp: new Date()
    })
    
    await waitForStoreAction(() => store.deleteTodo('1'))
    
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].id).toBe('2')
    expect(mockTodosApi.deleteTodo).toHaveBeenCalledWith('1')
  })
  
  it('should filter todos correctly', () => {
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

### Testing Store Composition

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

describe('Store Composition - User Profile', () => {
  setupStoreTest()
  
  it('should sync profile data when user logs in', async () => {
    const userStore = useUserStore()
    const profileStore = useProfileStore()
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }
    
    const mockProfile = {
      userId: '1',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    }
    
    mockUserApi.login.mockResolvedValue({
      data: { user: mockUser, token: 'token', expiresAt: new Date().toISOString() },
      message: 'Success',
      success: true,
      timestamp: new Date()
    })
    
    mockProfileApi.getProfile.mockResolvedValue({
      data: mockProfile,
      message: 'Success',
      success: true,
      timestamp: new Date()
    })
    
    await userStore.login({ email: 'test@example.com', password: 'password' })
    
    // Profile should be automatically fetched after login
    expect(profileStore.profile).toEqual(mockProfile)
    expect(mockProfileApi.getProfile).toHaveBeenCalledWith('1')
  })
  
  it('should clear profile data when user logs out', async () => {
    const userStore = useUserStore()
    const profileStore = useProfileStore()
    
    // Setup initial state
    profileStore.$patch({
      profile: {
        userId: '1',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        preferences: { theme: 'dark', language: 'en' }
      }
    })
    
    await userStore.logout()
    
    expect(profileStore.profile).toBeNull()
  })
  
  it('should handle profile update with user store sync', async () => {
    const userStore = useUserStore()
    const profileStore = useProfileStore()
    
    // Setup initial state
    userStore.$patch({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      },
      isAuthenticated: true
    })
    
    const updatedProfile = {
      userId: '1',
      bio: 'Updated bio',
      avatar: 'new-avatar.jpg',
      preferences: { theme: 'light', language: 'es' }
    }
    
    mockProfileApi.updateProfile.mockResolvedValue({
      data: updatedProfile,
      message: 'Updated',
      success: true,
      timestamp: new Date()
    })
    
    await profileStore.updateProfile({
      bio: 'Updated bio',
      avatar: 'new-avatar.jpg'
    })
    
    expect(profileStore.profile).toEqual(updatedProfile)
    expect(userStore.user?.preferences).toEqual(updatedProfile.preferences)
  })
})
```

## Integration Testing

### Testing Component-Store Integration

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

describe('TodoList Component Integration', () => {
  const mockTodos = [
    {
      id: '1',
      title: 'Test Todo 1',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Test Todo 2',
      completed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should render todos from store', async () => {
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: mockTodos,
      message: 'Success',
      success: true,
      timestamp: new Date()
    })
    
    const wrapper = mountWithPinia(TodoList)
    await waitForAsyncComponent(wrapper)
    
    const todoItems = wrapper.findAll('[data-testid="todo-item"]')
    expect(todoItems).toHaveLength(2)
    
    expect(todoItems[0].text()).toContain('Test Todo 1')
    expect(todoItems[1].text()).toContain('Test Todo 2')
  })
  
  it('should create new todo when form is submitted', async () => {
    const newTodo = {
      id: '3',
      title: 'New Todo',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: [],
      message: 'Success',
      success: true,
      timestamp: new Date()
    })
    
    mockTodosApi.createTodo.mockResolvedValue({
      data: newTodo,
      message: 'Created',
      success: true,
      timestamp: new Date()
    })
    
    const wrapper = mountWithPinia(TodoList)
    await waitForAsyncComponent(wrapper)
    
    const input = wrapper.find('[data-testid="todo-input"]')
    const form = wrapper.find('[data-testid="todo-form"]')
    
    await input.setValue('New Todo')
    await form.trigger('submit')
    
    expect(mockTodosApi.createTodo).toHaveBeenCalledWith({
      title: 'New Todo',
      completed: false
    })
  })
  
  it('should toggle todo completion', async () => {
    mockTodosApi.fetchTodos.mockResolvedValue({
      data: mockTodos,
      message: 'Success',
      success: true,
      timestamp: new Date()
    })
    
    mockTodosApi.updateTodo.mockResolvedValue({
      data: { ...mockTodos[0], completed: true },
      message: 'Updated',
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
  
  it('should display loading state', async () => {
    // Mock a slow API response
    mockTodosApi.fetchTodos.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: mockTodos,
          message: 'Success',
          success: true,
          timestamp: new Date()
        }), 100)
      )
    )
    
    const wrapper = mountWithPinia(TodoList)
    
    // Should show loading initially
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    
    await waitForAsyncComponent(wrapper)
    
    // Should hide loading after data loads
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
  })
  
  it('should display error state', async () => {
    mockTodosApi.fetchTodos.mockRejectedValue(new Error('Network error'))
    
    const wrapper = mountWithPinia(TodoList)
    await waitForAsyncComponent(wrapper)
    
    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error"]').text()).toContain('Network error')
  })
})
```

### Testing Store Persistence

```typescript
// src/stores/__tests__/persistence.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useUserStore } from '@stores/user'
import { setupStoreTest } from '@/test/store-utils'

describe('Store Persistence', () => {
  setupStoreTest()
  
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  it('should persist user data to localStorage', () => {
    const store = useUserStore()
    
    const userData = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }
    
    store.$patch({ user: userData, isAuthenticated: true })
    
    const stored = localStorage.getItem('user-store')
    expect(stored).toBeTruthy()
    
    const parsed = JSON.parse(stored!)
    expect(parsed.user).toEqual(userData)
    expect(parsed.isAuthenticated).toBe(true)
  })
  
  it('should restore user data from localStorage', () => {
    const userData = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }
    
    localStorage.setItem('user-store', JSON.stringify({
      user: userData,
      isAuthenticated: true
    }))
    
    const store = useUserStore()
    
    expect(store.user).toEqual(userData)
    expect(store.isAuthenticated).toBe(true)
  })
  
  it('should handle corrupted localStorage data', () => {
    localStorage.setItem('user-store', 'invalid-json')
    
    const store = useUserStore()
    
    // Should fallback to default state
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
  
  it('should clear persistence on logout', async () => {
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

## End-to-End Testing

### Playwright E2E Tests

```typescript
// tests/e2e/todos.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Todo Application E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })
  
  test('should create and manage todos', async ({ page }) => {
    // Create a new todo
    await page.fill('[data-testid="todo-input"]', 'Buy groceries')
    await page.click('[data-testid="add-todo-btn"]')
    
    // Verify todo appears in list
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('Buy groceries')
    
    // Mark todo as completed
    await page.check('[data-testid="todo-checkbox"]')
    
    // Verify todo is marked as completed
    await expect(page.locator('[data-testid="todo-item"]')).toHaveClass(/completed/)
    
    // Delete todo
    await page.click('[data-testid="delete-todo-btn"]')
    
    // Verify todo is removed
    await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(0)
  })
  
  test('should persist todos across page reloads', async ({ page }) => {
    // Create a todo
    await page.fill('[data-testid="todo-input"]', 'Persistent todo')
    await page.click('[data-testid="add-todo-btn"]')
    
    // Reload page
    await page.reload()
    
    // Verify todo persists
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('Persistent todo')
  })
  
  test('should filter todos correctly', async ({ page }) => {
    // Create multiple todos
    await page.fill('[data-testid="todo-input"]', 'Todo 1')
    await page.click('[data-testid="add-todo-btn"]')
    
    await page.fill('[data-testid="todo-input"]', 'Todo 2')
    await page.click('[data-testid="add-todo-btn"]')
    
    // Mark first todo as completed
    await page.check('[data-testid="todo-checkbox"]:first-child')
    
    // Filter by completed
    await page.click('[data-testid="filter-completed"]')
    
    // Should only show completed todo
    await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('Todo 1')
    
    // Filter by active
    await page.click('[data-testid="filter-active"]')
    
    // Should only show active todo
    await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('Todo 2')
  })
  
  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/todos', route => {
      route.abort('failed')
    })
    
    await page.goto('/')
    
    // Should display error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
  })
})
```

## Performance Testing

### Store Performance Tests

```typescript
// src/stores/__tests__/performance.test.ts
import { describe, it, expect } from 'vitest'
import { useProductsStore } from '@stores/products'
import { setupStoreTest } from '@/test/store-utils'

describe('Store Performance', () => {
  setupStoreTest()
  
  it('should handle large datasets efficiently', () => {
    const store = useProductsStore()
    
    // Generate large dataset
    const products = Array.from({ length: 10000 }, (_, i) => ({
      id: `product-${i}`,
      name: `Product ${i}`,
      price: Math.random() * 100,
      category: `Category ${i % 10}`,
      inStock: Math.random() > 0.5
    }))
    
    const start = performance.now()
    
    store.$patch({ products })
    
    const patchTime = performance.now() - start
    
    // Should patch large dataset quickly (< 100ms)
    expect(patchTime).toBeLessThan(100)
    
    const filterStart = performance.now()
    
    // Test filtering performance
    store.setFilters({ category: 'Category 1', inStock: true })
    const filtered = store.filteredProducts
    
    const filterTime = performance.now() - filterStart
    
    // Should filter quickly (< 50ms)
    expect(filterTime).toBeLessThan(50)
    expect(filtered.length).toBeGreaterThan(0)
  })
  
  it('should debounce search operations', async () => {
    const store = useProductsStore()
    
    let searchCallCount = 0
    const originalSearch = store.searchProducts
    
    store.searchProducts = (...args) => {
      searchCallCount++
      return originalSearch.apply(store, args)
    }
    
    // Rapid search calls
    store.searchProducts('test')
    store.searchProducts('test1')
    store.searchProducts('test12')
    store.searchProducts('test123')
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // Should only call search once due to debouncing
    expect(searchCallCount).toBe(1)
  })
})
```

## Coverage and Reporting

### Coverage Configuration

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

### Custom Test Reporter

```typescript
// src/test/reporter.ts
import type { Reporter } from 'vitest'

export class StoreTestReporter implements Reporter {
  onInit() {
    console.log('🧪 Starting Pinia store tests...')
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
    
    console.log(`\n📊 Store Test Summary:`)
    console.log(`   Total store tests: ${totalStoreTests}`)
    console.log(`   Passed: ${passedStoreTests}`)
    console.log(`   Failed: ${totalStoreTests - passedStoreTests}`)
    
    if (errors.length > 0) {
      console.log(`\n❌ Errors: ${errors.length}`)
    }
  }
}
```

This comprehensive testing guide provides patterns and examples for thoroughly testing Pinia stores, from basic unit tests to complex integration scenarios and end-to-end testing strategies.