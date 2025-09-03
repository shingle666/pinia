# 插件开发

开发自定义 Pinia 插件的综合指南，包括中间件、持久化、开发工具集成和扩展 Pinia 功能的高级插件模式。

## 功能特性

- 🔌 自定义插件架构
- 💾 持久化插件（localStorage、sessionStorage、IndexedDB）
- 🛠️ 开发工具集成
- 🔄 状态同步插件
- 📊 分析和监控插件
- 🎯 中间件系统
- 🔐 认证插件
- 🌐 API 集成插件
- 🧪 插件测试工具
- 📦 插件组合和链式调用

## 核心插件类型

```typescript
// types/plugin.ts
export interface PiniaPlugin {
  (context: PiniaPluginContext): void | Partial<PiniaCustomProperties>
}

export interface PiniaPluginContext {
  pinia: Pinia
  app: App
  store: Store
  options: DefineStoreOptions
}

export interface PluginConfig {
  name: string
  version: string
  enabled: boolean
  options?: Record<string, any>
}

export interface PersistenceOptions {
  key?: string
  storage?: Storage | 'localStorage' | 'sessionStorage' | 'indexedDB'
  paths?: string[]
  serializer?: {
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  beforeRestore?: (context: PersistenceContext) => void
  afterRestore?: (context: PersistenceContext) => void
}

export interface PersistenceContext {
  store: Store
  key: string
  storage: Storage
}

export interface AnalyticsEvent {
  type: string
  store: string
  action?: string
  payload?: any
  timestamp: Date
  userId?: string
  sessionId: string
}
```

## 持久化插件

```typescript
// plugins/persistence.ts
import type { PiniaPlugin, PersistenceOptions, PersistenceContext } from '@/types'

class PersistenceManager {
  private storages = new Map<string, Storage>()
  private serializers = new Map<string, any>()
  
  constructor() {
    // 注册默认存储
    this.registerStorage('localStorage', localStorage)
    this.registerStorage('sessionStorage', sessionStorage)
    
    // 注册默认序列化器
    this.registerSerializer('json', {
      serialize: JSON.stringify,
      deserialize: JSON.parse
    })
    
    this.registerSerializer('msgpack', {
      serialize: (value: any) => {
        // MessagePack 序列化（需要 msgpack 库）
        return btoa(JSON.stringify(value)) // 回退到 base64 JSON
      },
      deserialize: (value: string) => {
        return JSON.parse(atob(value))
      }
    })
  }
  
  registerStorage(name: string, storage: Storage) {
    this.storages.set(name, storage)
  }
  
  registerSerializer(name: string, serializer: any) {
    this.serializers.set(name, serializer)
  }
  
  getStorage(name: string): Storage {
    const storage = this.storages.get(name)
    if (!storage) {
      throw new Error(`存储 '${name}' 未找到`)
    }
    return storage
  }
  
  getSerializer(name: string) {
    return this.serializers.get(name) || this.serializers.get('json')
  }
}

const persistenceManager = new PersistenceManager()

export function createPersistencePlugin(globalOptions: PersistenceOptions = {}): PiniaPlugin {
  return ({ store, options }) => {
    const persistOptions = {
      key: `pinia-${store.$id}`,
      storage: 'localStorage',
      serializer: 'json',
      ...globalOptions,
      ...options.persist
    }
    
    if (!persistOptions || !options.persist) {
      return
    }
    
    const storage = typeof persistOptions.storage === 'string'
      ? persistenceManager.getStorage(persistOptions.storage)
      : persistOptions.storage
    
    const serializer = typeof persistOptions.serializer === 'string'
      ? persistenceManager.getSerializer(persistOptions.serializer)
      : persistOptions.serializer
    
    const context: PersistenceContext = {
      store,
      key: persistOptions.key,
      storage
    }
    
    // 初始化时恢复状态
    function restoreState() {
      try {
        persistOptions.beforeRestore?.(context)
        
        const stored = storage.getItem(persistOptions.key)
        if (stored) {
          const data = serializer.deserialize(stored)
          
          if (persistOptions.paths) {
            // 只恢复指定路径
            persistOptions.paths.forEach(path => {
              if (path in data) {
                setNestedProperty(store.$state, path, data[path])
              }
            })
          } else {
            // 恢复整个状态
            store.$patch(data)
          }
        }
        
        persistOptions.afterRestore?.(context)
      } catch (error) {
        console.error(`恢复 store '${store.$id}' 状态失败:`, error)
      }
    }
    
    // 状态变化时保存
    function saveState() {
      try {
        let dataToSave = store.$state
        
        if (persistOptions.paths) {
          // 只保存指定路径
          dataToSave = {}
          persistOptions.paths.forEach(path => {
            const value = getNestedProperty(store.$state, path)
            if (value !== undefined) {
              setNestedProperty(dataToSave, path, value)
            }
          })
        }
        
        const serialized = serializer.serialize(dataToSave)
        storage.setItem(persistOptions.key, serialized)
      } catch (error) {
        console.error(`保存 store '${store.$id}' 状态失败:`, error)
      }
    }
    
    // 工具函数
    function getNestedProperty(obj: any, path: string) {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }
    
    function setNestedProperty(obj: any, path: string, value: any) {
      const keys = path.split('.')
      const lastKey = keys.pop()!
      const target = keys.reduce((current, key) => {
        if (!(key in current)) {
          current[key] = {}
        }
        return current[key]
      }, obj)
      target[lastKey] = value
    }
    
    // 初始化
    restoreState()
    
    // 订阅变化
    store.$subscribe((mutation, state) => {
      saveState()
    }, { detached: true })
    
    // 添加清除方法
    store.$clearPersisted = () => {
      storage.removeItem(persistOptions.key)
    }
    
    return {
      $clearPersisted: store.$clearPersisted
    }
  }
}

// 创建 IndexedDB 存储的辅助函数
export function createIndexedDBStorage(dbName: string, storeName: string): Storage {
  let db: IDBDatabase | null = null
  
  const initDB = async () => {
    if (db) return db
    
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }
      
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName)
        }
      }
    })
  }
  
  return {
    async getItem(key: string): Promise<string | null> {
      const database = await initDB()
      const transaction = database.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result || null)
      })
    },
    
    async setItem(key: string, value: string): Promise<void> {
      const database = await initDB()
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.put(value, key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    },
    
    async removeItem(key: string): Promise<void> {
      const database = await initDB()
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    },
    
    async clear(): Promise<void> {
      const database = await initDB()
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    },
    
    get length(): number {
      throw new Error('IndexedDB 存储不支持 length 属性')
    },
    
    key(index: number): string | null {
      throw new Error('IndexedDB 存储不支持 key 方法')
    }
  } as Storage
}
```

## 分析插件

```typescript
// plugins/analytics.ts
import type { PiniaPlugin, AnalyticsEvent } from '@/types'

interface AnalyticsOptions {
  endpoint?: string
  apiKey?: string
  batchSize?: number
  flushInterval?: number
  enabledEvents?: string[]
  userId?: string
  sessionId?: string
  beforeSend?: (events: AnalyticsEvent[]) => AnalyticsEvent[]
  onError?: (error: Error) => void
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = []
  private options: Required<AnalyticsOptions>
  private flushTimer: number | null = null
  private sessionId: string
  
  constructor(options: AnalyticsOptions = {}) {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.options = {
      endpoint: '/api/analytics',
      apiKey: '',
      batchSize: 10,
      flushInterval: 5000,
      enabledEvents: ['*'],
      userId: '',
      sessionId: options.sessionId || this.sessionId,
      beforeSend: (events) => events,
      onError: (error) => console.error('分析错误:', error),
      ...options
    }
    
    this.startFlushTimer()
  }
  
  track(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>) {
    if (!this.shouldTrackEvent(event.type)) {
      return
    }
    
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
      sessionId: this.options.sessionId,
      userId: this.options.userId
    }
    
    this.events.push(fullEvent)
    
    if (this.events.length >= this.options.batchSize) {
      this.flush()
    }
  }
  
  private shouldTrackEvent(eventType: string): boolean {
    const { enabledEvents } = this.options
    return enabledEvents.includes('*') || enabledEvents.includes(eventType)
  }
  
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush()
      }
    }, this.options.flushInterval) as any
  }
  
  async flush() {
    if (this.events.length === 0) {
      return
    }
    
    const eventsToSend = this.options.beforeSend([...this.events])
    this.events = []
    
    try {
      await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.apiKey}`
        },
        body: JSON.stringify({ events: eventsToSend })
      })
    } catch (error) {
      this.options.onError(error as Error)
      // 失败时重新添加事件到队列
      this.events.unshift(...eventsToSend)
    }
  }
  
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush() // 最终刷新
  }
}

export function createAnalyticsPlugin(options: AnalyticsOptions = {}): PiniaPlugin {
  const analytics = new AnalyticsManager(options)
  
  return ({ store }) => {
    // 跟踪 store 创建
    analytics.track({
      type: 'store:created',
      store: store.$id
    })
    
    // 跟踪状态变化
    store.$subscribe((mutation, state) => {
      analytics.track({
        type: 'store:mutation',
        store: store.$id,
        action: mutation.type,
        payload: {
          storeId: mutation.storeId,
          type: mutation.type,
          events: mutation.events
        }
      })
    })
    
    // 跟踪操作调用
    store.$onAction(({ name, args, after, onError }) => {
      const startTime = Date.now()
      
      analytics.track({
        type: 'action:start',
        store: store.$id,
        action: name,
        payload: { args }
      })
      
      after((result) => {
        analytics.track({
          type: 'action:success',
          store: store.$id,
          action: name,
          payload: {
            duration: Date.now() - startTime,
            result: typeof result
          }
        })
      })
      
      onError((error) => {
        analytics.track({
          type: 'action:error',
          store: store.$id,
          action: name,
          payload: {
            duration: Date.now() - startTime,
            error: error.message
          }
        })
      })
    })
    
    return {
      $analytics: analytics
    }
  }
}
```

## 开发工具插件

```typescript
// plugins/devtools.ts
import type { PiniaPlugin } from '@/types'

interface DevToolsOptions {
  enabled?: boolean
  logActions?: boolean
  logMutations?: boolean
  maxHistorySize?: number
  persistHistory?: boolean
}

interface HistoryEntry {
  id: string
  type: 'action' | 'mutation'
  store: string
  name: string
  payload?: any
  state: any
  timestamp: Date
}

class DevToolsManager {
  private history: HistoryEntry[] = []
  private options: Required<DevToolsOptions>
  private isRecording = true
  
  constructor(options: DevToolsOptions = {}) {
    this.options = {
      enabled: process.env.NODE_ENV === 'development',
      logActions: true,
      logMutations: true,
      maxHistorySize: 100,
      persistHistory: false,
      ...options
    }
    
    if (this.options.enabled) {
      this.setupDevTools()
    }
  }
  
  private setupDevTools() {
    // 添加到 window 供浏览器访问
    if (typeof window !== 'undefined') {
      (window as any).__PINIA_DEVTOOLS__ = this
    }
    
    // 设置键盘快捷键
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          this.toggleRecording()
        }
      })
    }
  }
  
  addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    if (!this.isRecording || !this.options.enabled) {
      return
    }
    
    const historyEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    
    this.history.push(historyEntry)
    
    // 限制历史大小
    if (this.history.length > this.options.maxHistorySize) {
      this.history = this.history.slice(-this.options.maxHistorySize)
    }
    
    this.logEntry(historyEntry)
  }
  
  private logEntry(entry: HistoryEntry) {
    const shouldLog = 
      (entry.type === 'action' && this.options.logActions) ||
      (entry.type === 'mutation' && this.options.logMutations)
    
    if (!shouldLog) {
      return
    }
    
    const color = entry.type === 'action' ? '#4CAF50' : '#2196F3'
    const icon = entry.type === 'action' ? '🎯' : '🔄'
    
    console.groupCollapsed(
      `%c${icon} ${entry.store}/${entry.name}`,
      `color: ${color}; font-weight: bold`
    )
    
    console.log('类型:', entry.type)
    console.log('Store:', entry.store)
    console.log('时间戳:', entry.timestamp.toISOString())
    
    if (entry.payload) {
      console.log('载荷:', entry.payload)
    }
    
    console.log('状态:', entry.state)
    console.groupEnd()
  }
  
  getHistory(): HistoryEntry[] {
    return [...this.history]
  }
  
  clearHistory() {
    this.history = []
    console.clear()
  }
  
  toggleRecording() {
    this.isRecording = !this.isRecording
    console.log(`开发工具记录 ${this.isRecording ? '已启用' : '已禁用'}`)
  }
  
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2)
  }
  
  importHistory(data: string) {
    try {
      this.history = JSON.parse(data)
    } catch (error) {
      console.error('导入历史失败:', error)
    }
  }
  
  getStoreSnapshot(storeId: string): any {
    const entries = this.history.filter(entry => entry.store === storeId)
    return entries[entries.length - 1]?.state || null
  }
}

export function createDevToolsPlugin(options: DevToolsOptions = {}): PiniaPlugin {
  const devTools = new DevToolsManager(options)
  
  return ({ store }) => {
    if (!devTools.options.enabled) {
      return
    }
    
    // 跟踪操作
    store.$onAction(({ name, args, after, onError }) => {
      const startTime = Date.now()
      
      after((result) => {
        devTools.addHistoryEntry({
          type: 'action',
          store: store.$id,
          name,
          payload: { args, result, duration: Date.now() - startTime },
          state: store.$state
        })
      })
      
      onError((error) => {
        devTools.addHistoryEntry({
          type: 'action',
          store: store.$id,
          name,
          payload: { args, error: error.message, duration: Date.now() - startTime },
          state: store.$state
        })
      })
    })
    
    // 跟踪变更
    store.$subscribe((mutation, state) => {
      devTools.addHistoryEntry({
        type: 'mutation',
        store: store.$id,
        name: mutation.type,
        payload: mutation,
        state: { ...state }
      })
    })
    
    return {
      $devTools: devTools
    }
  }
}
```

## API 集成插件

```typescript
// plugins/api-integration.ts
import type { PiniaPlugin } from '@/types'

interface ApiOptions {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  interceptors?: {
    request?: (config: RequestConfig) => RequestConfig
    response?: (response: any) => any
    error?: (error: any) => any
  }
  retryConfig?: {
    retries: number
    delay: number
    backoff: 'linear' | 'exponential'
  }
}

interface RequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
}

class ApiClient {
  private options: Required<ApiOptions>
  
  constructor(options: ApiOptions = {}) {
    this.options = {
      baseURL: '',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      interceptors: {},
      retryConfig: {
        retries: 3,
        delay: 1000,
        backoff: 'exponential'
      },
      ...options
    }
  }
  
  async request<T = any>(config: RequestConfig): Promise<T> {
    const fullConfig = {
      ...config,
      url: this.options.baseURL + config.url,
      headers: {
        ...this.options.headers,
        ...config.headers
      }
    }
    
    // 应用请求拦截器
    const processedConfig = this.options.interceptors.request
      ? this.options.interceptors.request(fullConfig)
      : fullConfig
    
    return this.executeWithRetry(processedConfig)
  }
  
  private async executeWithRetry<T>(config: RequestConfig, attempt = 1): Promise<T> {
    try {
      const response = await this.executeRequest(config)
      
      // 应用响应拦截器
      return this.options.interceptors.response
        ? this.options.interceptors.response(response)
        : response
    } catch (error) {
      if (attempt <= this.options.retryConfig.retries) {
        const delay = this.calculateDelay(attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.executeWithRetry(config, attempt + 1)
      }
      
      // 应用错误拦截器
      if (this.options.interceptors.error) {
        this.options.interceptors.error(error)
      }
      
      throw error
    }
  }
  
  private calculateDelay(attempt: number): number {
    const { delay, backoff } = this.options.retryConfig
    
    if (backoff === 'exponential') {
      return delay * Math.pow(2, attempt - 1)
    }
    
    return delay * attempt
  }
  
  private async executeRequest(config: RequestConfig): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)
    
    try {
      const url = config.params
        ? `${config.url}?${new URLSearchParams(config.params)}`
        : config.url
      
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.data ? JSON.stringify(config.data) : undefined,
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }
  
  get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return this.request({ url, method: 'GET', params })
  }
  
  post<T = any>(url: string, data?: any): Promise<T> {
    return this.request({ url, method: 'POST', data })
  }
  
  put<T = any>(url: string, data?: any): Promise<T> {
    return this.request({ url, method: 'PUT', data })
  }
  
  delete<T = any>(url: string): Promise<T> {
    return this.request({ url, method: 'DELETE' })
  }
  
  patch<T = any>(url: string, data?: any): Promise<T> {
    return this.request({ url, method: 'PATCH', data })
  }
}

export function createApiPlugin(options: ApiOptions = {}): PiniaPlugin {
  const apiClient = new ApiClient(options)
  
  return ({ store }) => {
    return {
      $api: apiClient
    }
  }
}
```

## 插件组合

```typescript
// plugins/composition.ts
import type { PiniaPlugin } from '@/types'

export function composePlugins(...plugins: PiniaPlugin[]): PiniaPlugin {
  return (context) => {
    const results: any[] = []
    
    for (const plugin of plugins) {
      const result = plugin(context)
      if (result) {
        results.push(result)
      }
    }
    
    // 合并所有插件结果
    return results.reduce((merged, result) => {
      return { ...merged, ...result }
    }, {})
  }
}

export function createConditionalPlugin(
  condition: (context: any) => boolean,
  plugin: PiniaPlugin
): PiniaPlugin {
  return (context) => {
    if (condition(context)) {
      return plugin(context)
    }
  }
}

export function createAsyncPlugin(
  asyncPlugin: (context: any) => Promise<any>
): PiniaPlugin {
  return (context) => {
    asyncPlugin(context).catch(error => {
      console.error('异步插件错误:', error)
    })
  }
}
```

## 使用示例

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { 
  createPersistencePlugin,
  createAnalyticsPlugin,
  createDevToolsPlugin,
  createApiPlugin,
  composePlugins
} from '@/plugins'

const app = createApp(App)
const pinia = createPinia()

// 配置插件
const persistencePlugin = createPersistencePlugin({
  storage: 'localStorage',
  serializer: 'json'
})

const analyticsPlugin = createAnalyticsPlugin({
  endpoint: '/api/analytics',
  apiKey: process.env.VITE_ANALYTICS_KEY,
  enabledEvents: ['action:start', 'action:success', 'action:error']
})

const devToolsPlugin = createDevToolsPlugin({
  enabled: process.env.NODE_ENV === 'development',
  logActions: true,
  logMutations: false
})

const apiPlugin = createApiPlugin({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000,
  interceptors: {
    request: (config) => {
      // 添加认证令牌
      const token = localStorage.getItem('auth-token')
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
      }
      return config
    },
    error: (error) => {
      console.error('API 错误:', error)
    }
  }
})

// 组合并使用插件
pinia.use(composePlugins(
  persistencePlugin,
  analyticsPlugin,
  devToolsPlugin,
  apiPlugin
))

app.use(pinia)
app.mount('#app')
```

## 带插件的 Store

```typescript
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null as string | null,
    name: '',
    email: '',
    preferences: {
      theme: 'light',
      language: 'zh'
    }
  }),
  
  actions: {
    async login(credentials: { email: string; password: string }) {
      const response = await this.$api.post('/auth/login', credentials)
      
      this.id = response.user.id
      this.name = response.user.name
      this.email = response.user.email
      
      localStorage.setItem('auth-token', response.token)
      
      return response
    },
    
    async updatePreferences(preferences: Partial<typeof this.preferences>) {
      this.preferences = { ...this.preferences, ...preferences }
      
      await this.$api.put('/user/preferences', this.preferences)
    },
    
    logout() {
      this.$reset()
      localStorage.removeItem('auth-token')
      this.$clearPersisted()
    }
  },
  
  // 插件配置
  persist: {
    paths: ['id', 'name', 'email', 'preferences'],
    beforeRestore: (context) => {
      console.log('正在恢复用户状态...')
    }
  }
})
```

## 测试插件

```typescript
// plugins/__tests__/persistence.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { createPersistencePlugin } from '../persistence'

describe('持久化插件', () => {
  let pinia: any
  let mockStorage: Storage
  
  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    }
    
    pinia = createPinia()
    pinia.use(createPersistencePlugin({ storage: mockStorage }))
    setActivePinia(pinia)
  })
  
  it('应该持久化 store 状态', () => {
    const useTestStore = defineStore('test', {
      state: () => ({ count: 0 }),
      actions: {
        increment() {
          this.count++
        }
      },
      persist: true
    })
    
    const store = useTestStore()
    store.increment()
    
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'pinia-test',
      JSON.stringify({ count: 1 })
    )
  })
  
  it('应该恢复持久化状态', () => {
    vi.mocked(mockStorage.getItem).mockReturnValue(
      JSON.stringify({ count: 5 })
    )
    
    const useTestStore = defineStore('test', {
      state: () => ({ count: 0 }),
      persist: true
    })
    
    const store = useTestStore()
    
    expect(store.count).toBe(5)
  })
  
  it('应该清除持久化数据', () => {
    const useTestStore = defineStore('test', {
      state: () => ({ count: 0 }),
      persist: true
    })
    
    const store = useTestStore()
    store.$clearPersisted()
    
    expect(mockStorage.removeItem).toHaveBeenCalledWith('pinia-test')
  })
})
```

## 最佳实践

1. **插件设计**: 保持插件专注于单一职责
2. **错误处理**: 在插件中始终优雅地处理错误
3. **性能**: 避免在插件钩子中进行重操作
4. **配置**: 使插件可配置且可选
5. **测试**: 为插件功能编写全面的测试
6. **文档**: 记录插件 API 和使用模式
7. **组合**: 设计插件以便良好地协同工作
8. **清理**: 在 store 销毁时正确清理资源

这个插件系统为扩展 Pinia 的自定义功能提供了强大的基础，同时保持了关注点的清晰分离。