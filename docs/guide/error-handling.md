# Error Handling

Pinia provides several mechanisms for handling errors in your stores, from basic try-catch blocks to advanced error recovery strategies. This guide covers best practices for error handling in Pinia applications.

## Basic Error Handling

### Try-Catch in Actions

The most straightforward way to handle errors is using try-catch blocks in your actions:

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
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }
      user.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error fetching user:', err)
    } finally {
      loading.value = false
    }
  }

  return { user, error, loading, fetchUser }
})
```

### Error State Management

Maintain error state alongside your data:

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
      const message = error instanceof Error ? error.message : 'Unknown error'
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

## Advanced Error Handling

### Global Error Handler

Create a global error handling store:

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
    
    // Auto-remove after 5 seconds for non-error types
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

### Error Boundary Pattern

Implement error boundaries for different parts of your application:

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
    console.error(`Error in boundary ${boundaryName}:`, error)
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

## Retry Mechanisms

### Exponential Backoff

Implement retry logic with exponential backoff:

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
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  return { withRetry }
})
```

### Circuit Breaker Pattern

Implement circuit breaker for failing services:

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
      throw new Error(`Circuit ${circuitName} not found`)
    }

    if (circuit.state === 'OPEN') {
      if (Date.now() - circuit.lastFailureTime > 60000) {
        circuit.state = 'HALF_OPEN'
        circuit.successCount = 0
      } else {
        throw new Error(`Circuit ${circuitName} is OPEN`)
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

## Error Recovery

### Optimistic Updates with Rollback

```typescript
export const useOptimisticStore = defineStore('optimistic', () => {
  const items = ref<Item[]>([])
  const pendingOperations = ref<Map<string, () => void>>(new Map())

  async function updateItemOptimistically(id: string, updates: Partial<Item>) {
    const originalItem = items.value.find(item => item.id === id)
    if (!originalItem) return

    // Store rollback function
    const rollback = () => {
      const index = items.value.findIndex(item => item.id === id)
      if (index > -1) {
        items.value[index] = originalItem
      }
    }
    
    const operationId = `update_${id}_${Date.now()}`
    pendingOperations.value.set(operationId, rollback)

    // Apply optimistic update
    const index = items.value.findIndex(item => item.id === id)
    if (index > -1) {
      items.value[index] = { ...originalItem, ...updates }
    }

    try {
      await updateItemOnServer(id, updates)
      pendingOperations.value.delete(operationId)
    } catch (error) {
      // Rollback on failure
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

## Error Monitoring

### Error Tracking

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
    
    // Send to monitoring service
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
      console.error('Failed to send error to monitoring service:', err)
    }
  }

  return {
    errorHistory: readonly(errorHistory),
    trackError
  }
})
```

## Best Practices

### 1. Consistent Error Format

Use a consistent error format across your application:

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

### 2. Error Classification

Classify errors by type and severity:

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

### 3. User-Friendly Error Messages

Provide meaningful error messages to users:

```typescript
function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.'
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.'
    case 'AUTH_ERROR':
      return 'Please log in to continue.'
    default:
      return 'Something went wrong. Please try again later.'
  }
}
```

### 4. Error Prevention

Implement validation and guards to prevent errors:

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

## Testing Error Handling

```typescript
import { describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user-store'

describe('User Store Error Handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should handle fetch errors gracefully', async () => {
    const store = useUserStore()
    
    // Mock fetch to throw an error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    await store.fetchUser('123')
    
    expect(store.error).toBe('Network error')
    expect(store.user).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('should handle HTTP errors', async () => {
    const store = useUserStore()
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })
    
    await store.fetchUser('123')
    
    expect(store.error).toBe('Failed to fetch user: Not Found')
  })
})
```

By implementing these error handling patterns, you can create robust Pinia applications that gracefully handle failures and provide a better user experience.