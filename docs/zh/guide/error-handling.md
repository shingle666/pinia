# 错误处理

Pinia 提供了多种机制来处理 store 中的错误，从基本的 try-catch 块到高级的错误恢复策略。本指南涵盖了 Pinia 应用程序中错误处理的最佳实践。

## 基础错误处理

### 在 Actions 中使用 Try-Catch

处理错误最直接的方法是在 actions 中使用 try-catch 块：

```typescript
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const error = ref(null)
  const loading = ref(false)

  async function fetchUser(id: string) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) {
        throw new Error(`获取用户失败: ${response.statusText}`)
      }
      user.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('获取用户错误:', err)
    } finally {
      loading.value = false
    }
  }

  return { user, error, loading, fetchUser }
})
```

### 错误状态管理

在数据旁边维护错误状态：

```typescript
export const useApiStore = defineStore('api', () => {
  const data = ref([])
  const errors = ref({})
  const loadingStates = ref({})

  function setError(key: string, error: string | null) {
    errors.value[key] = error
  }

  function clearError(key: string) {
    delete errors.value[key]
  }

  function setLoading(key: string, loading: boolean) {
    loadingStates.value[key] = loading
  }

  async function fetchData(endpoint: string) {
    const key = `fetch_${endpoint}`
    setLoading(key, true)
    clearError(key)

    try {
      const response = await fetch(`/api/${endpoint}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const result = await response.json()
      data.value = result
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      setError(key, message)
      throw error
    } finally {
      setLoading(key, false)
    }
  }

  return {
    data,
    errors: readonly(errors),
    loadingStates: readonly(loadingStates),
    fetchData,
    setError,
    clearError
  }
})
```

## 高级错误处理

### 全局错误处理器

创建全局错误处理 store：

```typescript
export const useErrorStore = defineStore('error', () => {
  const errors = ref<Array<{ id: string; message: string; timestamp: Date; type: 'error' | 'warning' | 'info' }>>([])

  function addError(message: string, type: 'error' | 'warning' | 'info' = 'error') {
    const error = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    }
    errors.value.push(error)
    
    // 非错误类型 5 秒后自动移除
    if (type !== 'error') {
      setTimeout(() => removeError(error.id), 5000)
    }
  }

  function removeError(id: string) {
    const index = errors.value.findIndex(error => error.id === id)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }

  function clearAllErrors() {
    errors.value = []
  }

  return {
    errors: readonly(errors),
    addError,
    removeError,
    clearAllErrors
  }
})
```

### 错误边界模式

为应用程序的不同部分实现错误边界：

```typescript
export const useErrorBoundaryStore = defineStore('errorBoundary', () => {
  const boundaries = ref<Record<string, { hasError: boolean; error: Error | null }>>({})

  function createBoundary(name: string) {
    boundaries.value[name] = {
      hasError: false,
      error: null
    }
  }

  function catchError(boundaryName: string, error: Error) {
    if (boundaries.value[boundaryName]) {
      boundaries.value[boundaryName].hasError = true
      boundaries.value[boundaryName].error = error
    }
    console.error(`边界 ${boundaryName} 中的错误:`, error)
  }

  function resetBoundary(boundaryName: string) {
    if (boundaries.value[boundaryName]) {
      boundaries.value[boundaryName].hasError = false
      boundaries.value[boundaryName].error = null
    }
  }

  return {
    boundaries: readonly(boundaries),
    createBoundary,
    catchError,
    resetBoundary
  }
})
```

## 重试机制

### 指数退避

实现带指数退避的重试逻辑：

```typescript
export const useRetryStore = defineStore('retry', () => {
  async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误')
        
        if (attempt === maxRetries) {
          throw lastError
        }

        // 指数退避: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  return { withRetry }
})
```

### 断路器模式

为失败的服务实现断路器：

```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export const useCircuitBreakerStore = defineStore('circuitBreaker', () => {
  const circuits = ref<Record<string, {
    state: CircuitState
    failureCount: number
    lastFailureTime: number
    successCount: number
  }>>({})

  function createCircuit(name: string, threshold: number = 5, timeout: number = 60000) {
    circuits.value[name] = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0
    }
  }

  async function executeWithCircuitBreaker<T>(
    circuitName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const circuit = circuits.value[circuitName]
    if (!circuit) {
      throw new Error(`断路器 ${circuitName} 未找到`)
    }

    if (circuit.state === 'OPEN') {
      if (Date.now() - circuit.lastFailureTime > 60000) {
        circuit.state = 'HALF_OPEN'
        circuit.successCount = 0
      } else {
        throw new Error(`断路器 ${circuitName} 处于开启状态`)
      }
    }

    try {
      const result = await operation()
      
      if (circuit.state === 'HALF_OPEN') {
        circuit.successCount++
        if (circuit.successCount >= 3) {
          circuit.state = 'CLOSED'
          circuit.failureCount = 0
        }
      }
      
      return result
    } catch (error) {
      circuit.failureCount++
      circuit.lastFailureTime = Date.now()
      
      if (circuit.failureCount >= 5) {
        circuit.state = 'OPEN'
      }
      
      throw error
    }
  }

  return {
    circuits: readonly(circuits),
    createCircuit,
    executeWithCircuitBreaker
  }
})
```

## 错误恢复

### 乐观更新与回滚

```typescript
export const useOptimisticStore = defineStore('optimistic', () => {
  const items = ref<Item[]>([])
  const pendingOperations = ref<Map<string, () => void>>(new Map())

  async function updateItemOptimistically(id: string, updates: Partial<Item>) {
    const originalItem = items.value.find(item => item.id === id)
    if (!originalItem) return

    // 存储回滚函数
    const rollback = () => {
      const index = items.value.findIndex(item => item.id === id)
      if (index > -1) {
        items.value[index] = originalItem
      }
    }
    
    const operationId = `update_${id}_${Date.now()}`
    pendingOperations.value.set(operationId, rollback)

    // 应用乐观更新
    const index = items.value.findIndex(item => item.id === id)
    if (index > -1) {
      items.value[index] = { ...originalItem, ...updates }
    }

    try {
      await updateItemOnServer(id, updates)
      pendingOperations.value.delete(operationId)
    } catch (error) {
      // 失败时回滚
      rollback()
      pendingOperations.value.delete(operationId)
      throw error
    }
  }

  return {
    items: readonly(items),
    updateItemOptimistically
  }
})
```

## 错误监控

### 错误跟踪

```typescript
export const useErrorTrackingStore = defineStore('errorTracking', () => {
  const errorHistory = ref<Array<{
    error: Error
    context: string
    timestamp: Date
    userAgent: string
    url: string
  }>>([])

  function trackError(error: Error, context: string = 'unknown') {
    const errorRecord = {
      error,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    errorHistory.value.push(errorRecord)
    
    // 发送到监控服务
    sendToMonitoringService(errorRecord)
  }

  async function sendToMonitoringService(errorRecord: any) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: errorRecord.error.message,
          stack: errorRecord.error.stack,
          context: errorRecord.context,
          timestamp: errorRecord.timestamp,
          userAgent: errorRecord.userAgent,
          url: errorRecord.url
        })
      })
    } catch (err) {
      console.error('发送错误到监控服务失败:', err)
    }
  }

  return {
    errorHistory: readonly(errorHistory),
    trackError
  }
})
```

## 最佳实践

### 1. 一致的错误格式

在应用程序中使用一致的错误格式：

```typescript
interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

function createAppError(code: string, message: string, details?: any): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date()
  }
}
```

### 2. 错误分类

按类型和严重程度对错误进行分类：

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT'
}

enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### 3. 用户友好的错误消息

为用户提供有意义的错误消息：

```typescript
function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return '请检查您的网络连接并重试。'
    case 'VALIDATION_ERROR':
      return '请检查您的输入并重试。'
    case 'AUTH_ERROR':
      return '请登录后继续。'
    default:
      return '出现了一些问题，请稍后重试。'
  }
}
```

### 4. 错误预防

实现验证和守卫来预防错误：

```typescript
export const useValidationStore = defineStore('validation', () => {
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  function validateRequired(value: any): boolean {
    return value !== null && value !== undefined && value !== ''
  }

  function validateLength(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max
  }

  return {
    validateEmail,
    validateRequired,
    validateLength
  }
})
```

## 测试错误处理

```typescript
import { describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user-store'

describe('用户 Store 错误处理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该优雅地处理获取错误', async () => {
    const store = useUserStore()
    
    // 模拟 fetch 抛出错误
    global.fetch = vi.fn().mockRejectedValue(new Error('网络错误'))
    
    await store.fetchUser('123')
    
    expect(store.error).toBe('网络错误')
    expect(store.user).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('应该处理 HTTP 错误', async () => {
    const store = useUserStore()
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })
    
    await store.fetchUser('123')
    
    expect(store.error).toBe('获取用户失败: Not Found')
  })
})
```

通过实现这些错误处理模式，您可以创建健壮的 Pinia 应用程序，优雅地处理故障并提供更好的用户体验。