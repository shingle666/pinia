# Store Composition Patterns

Advanced patterns for composing and organizing Pinia stores in complex applications, demonstrating modular architecture, dependency injection, and cross-store communication strategies.

## Features

- 🏗️ Modular store architecture
- 🔗 Cross-store communication patterns
- 💉 Dependency injection for stores
- 🎯 Store factory patterns
- 🔄 Event-driven store interactions
- 📦 Store modules and namespacing
- 🧩 Composable store utilities
- 🎨 Higher-order store patterns
- 🔒 Store access control and permissions
- 🧪 Testing composed stores

## Core Types

```typescript
// types/store-composition.ts
export interface StoreModule {
  id: string
  name: string
  dependencies?: string[]
  permissions?: string[]
  metadata?: Record<string, any>
}

export interface StoreRegistry {
  stores: Map<string, any>
  dependencies: Map<string, string[]>
  permissions: Map<string, string[]>
}

export interface StoreEvent {
  type: string
  source: string
  target?: string
  payload?: any
  timestamp: Date
}

export interface StoreFactory<T = any> {
  create(config: any): T
  destroy(store: T): void
  configure(store: T, config: any): void
}

export interface ComposedStore {
  modules: Record<string, any>
  events: StoreEvent[]
  registry: StoreRegistry
}

export interface StorePermission {
  action: string
  resource: string
  condition?: (context: any) => boolean
}
```

## Store Registry System

```typescript
// stores/registry.ts
import { defineStore } from 'pinia'
import type { StoreRegistry, StoreModule, StoreEvent } from '@/types'

export const useStoreRegistry = defineStore('store-registry', () => {
  const registry = ref<StoreRegistry>({
    stores: new Map(),
    dependencies: new Map(),
    permissions: new Map()
  })
  
  const events = ref<StoreEvent[]>([])
  const eventListeners = ref<Map<string, Function[]>>(new Map())
  
  // Store Registration
  function registerStore(module: StoreModule, store: any) {
    registry.value.stores.set(module.id, store)
    
    if (module.dependencies) {
      registry.value.dependencies.set(module.id, module.dependencies)
    }
    
    if (module.permissions) {
      registry.value.permissions.set(module.id, module.permissions)
    }
    
    emitEvent({
      type: 'store:registered',
      source: 'registry',
      payload: { module, store },
      timestamp: new Date()
    })
  }
  
  function unregisterStore(storeId: string) {
    const store = registry.value.stores.get(storeId)
    
    if (store) {
      registry.value.stores.delete(storeId)
      registry.value.dependencies.delete(storeId)
      registry.value.permissions.delete(storeId)
      
      emitEvent({
        type: 'store:unregistered',
        source: 'registry',
        payload: { storeId, store },
        timestamp: new Date()
      })
    }
  }
  
  // Dependency Resolution
  function resolveDependencies(storeId: string): any[] {
    const dependencies = registry.value.dependencies.get(storeId) || []
    const resolved: any[] = []
    
    for (const depId of dependencies) {
      const depStore = registry.value.stores.get(depId)
      if (!depStore) {
        throw new Error(`Dependency '${depId}' not found for store '${storeId}'`)
      }
      resolved.push(depStore)
    }
    
    return resolved
  }
  
  function validateDependencies(storeId: string): boolean {
    const dependencies = registry.value.dependencies.get(storeId) || []
    
    for (const depId of dependencies) {
      if (!registry.value.stores.has(depId)) {
        return false
      }
    }
    
    return true
  }
  
  // Event System
  function emitEvent(event: StoreEvent) {
    events.value.push(event)
    
    // Limit event history
    if (events.value.length > 1000) {
      events.value = events.value.slice(-500)
    }
    
    // Notify listeners
    const listeners = eventListeners.value.get(event.type) || []
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error(`Error in event listener for '${event.type}':`, error)
      }
    })
  }
  
  function addEventListener(eventType: string, listener: Function) {
    const listeners = eventListeners.value.get(eventType) || []
    listeners.push(listener)
    eventListeners.value.set(eventType, listeners)
    
    return () => removeEventListener(eventType, listener)
  }
  
  function removeEventListener(eventType: string, listener: Function) {
    const listeners = eventListeners.value.get(eventType) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
      eventListeners.value.set(eventType, listeners)
    }
  }
  
  // Store Access
  function getStore<T = any>(storeId: string): T | undefined {
    return registry.value.stores.get(storeId)
  }
  
  function hasStore(storeId: string): boolean {
    return registry.value.stores.has(storeId)
  }
  
  function getAllStores(): Map<string, any> {
    return new Map(registry.value.stores)
  }
  
  // Permission System
  function checkPermission(storeId: string, permission: string): boolean {
    const permissions = registry.value.permissions.get(storeId) || []
    return permissions.includes(permission) || permissions.includes('*')
  }
  
  // Computed
  const storeCount = computed(() => registry.value.stores.size)
  const registeredStores = computed(() => Array.from(registry.value.stores.keys()))
  const recentEvents = computed(() => events.value.slice(-10))
  
  return {
    // State
    registry: readonly(registry),
    events: readonly(events),
    
    // Actions
    registerStore,
    unregisterStore,
    resolveDependencies,
    validateDependencies,
    emitEvent,
    addEventListener,
    removeEventListener,
    getStore,
    hasStore,
    getAllStores,
    checkPermission,
    
    // Computed
    storeCount,
    registeredStores,
    recentEvents
  }
})
```

## Store Factory Pattern

```typescript
// stores/factories/base-factory.ts
import { defineStore } from 'pinia'
import type { StoreFactory } from '@/types'

export interface BaseStoreConfig {
  id: string
  name: string
  initialState?: Record<string, any>
  actions?: Record<string, Function>
  getters?: Record<string, Function>
  plugins?: any[]
}

export class BaseStoreFactory implements StoreFactory {
  private stores = new Map<string, any>()
  
  create(config: BaseStoreConfig) {
    if (this.stores.has(config.id)) {
      return this.stores.get(config.id)
    }
    
    const store = defineStore(config.id, () => {
      // Initialize state
      const state = reactive(config.initialState || {})
      
      // Create getters
      const getters: Record<string, ComputedRef> = {}
      if (config.getters) {
        Object.entries(config.getters).forEach(([key, getter]) => {
          getters[key] = computed(() => getter(state))
        })
      }
      
      // Create actions
      const actions: Record<string, Function> = {}
      if (config.actions) {
        Object.entries(config.actions).forEach(([key, action]) => {
          actions[key] = (...args: any[]) => action(state, ...args)
        })
      }
      
      // Add common actions
      actions.$reset = () => {
        Object.assign(state, config.initialState || {})
      }
      
      actions.$patch = (updates: any) => {
        Object.assign(state, updates)
      }
      
      return {
        ...state,
        ...getters,
        ...actions
      }
    })
    
    this.stores.set(config.id, store)
    return store
  }
  
  destroy(store: any) {
    const storeId = store.$id
    if (this.stores.has(storeId)) {
      this.stores.delete(storeId)
      // Additional cleanup if needed
    }
  }
  
  configure(store: any, config: Partial<BaseStoreConfig>) {
    // Dynamic reconfiguration logic
    if (config.actions) {
      Object.entries(config.actions).forEach(([key, action]) => {
        store[key] = action
      })
    }
  }
  
  getStore(id: string) {
    return this.stores.get(id)
  }
  
  getAllStores() {
    return Array.from(this.stores.values())
  }
}

// Entity Store Factory
export class EntityStoreFactory extends BaseStoreFactory {
  create(config: BaseStoreConfig & {
    entityName: string
    apiEndpoint: string
    schema?: any
  }) {
    const entityConfig = {
      ...config,
      initialState: {
        items: [],
        loading: false,
        error: null,
        selectedId: null,
        filters: {},
        pagination: {
          page: 1,
          limit: 20,
          total: 0
        },
        ...config.initialState
      },
      actions: {
        async fetchItems(state: any, params = {}) {
          state.loading = true
          state.error = null
          
          try {
            const response = await fetch(`${config.apiEndpoint}?${new URLSearchParams(params)}`)
            const data = await response.json()
            
            state.items = data.items || data
            state.pagination = data.pagination || state.pagination
          } catch (error) {
            state.error = error.message
          } finally {
            state.loading = false
          }
        },
        
        async createItem(state: any, item: any) {
          try {
            const response = await fetch(config.apiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            })
            
            const newItem = await response.json()
            state.items.push(newItem)
            return newItem
          } catch (error) {
            state.error = error.message
            throw error
          }
        },
        
        async updateItem(state: any, id: string, updates: any) {
          try {
            const response = await fetch(`${config.apiEndpoint}/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            })
            
            const updatedItem = await response.json()
            const index = state.items.findIndex((item: any) => item.id === id)
            if (index > -1) {
              state.items[index] = updatedItem
            }
            return updatedItem
          } catch (error) {
            state.error = error.message
            throw error
          }
        },
        
        async deleteItem(state: any, id: string) {
          try {
            await fetch(`${config.apiEndpoint}/${id}`, {
              method: 'DELETE'
            })
            
            state.items = state.items.filter((item: any) => item.id !== id)
          } catch (error) {
            state.error = error.message
            throw error
          }
        },
        
        selectItem(state: any, id: string | null) {
          state.selectedId = id
        },
        
        setFilters(state: any, filters: any) {
          state.filters = { ...state.filters, ...filters }
        },
        
        clearFilters(state: any) {
          state.filters = {}
        },
        
        ...config.actions
      },
      getters: {
        selectedItem: (state: any) => 
          state.items.find((item: any) => item.id === state.selectedId),
        
        filteredItems: (state: any) => {
          let filtered = state.items
          
          Object.entries(state.filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              filtered = filtered.filter((item: any) => {
                if (typeof value === 'string') {
                  return item[key]?.toString().toLowerCase().includes(value.toLowerCase())
                }
                return item[key] === value
              })
            }
          })
          
          return filtered
        },
        
        itemCount: (state: any) => state.items.length,
        isLoading: (state: any) => state.loading,
        hasError: (state: any) => !!state.error,
        
        ...config.getters
      }
    }
    
    return super.create(entityConfig)
  }
}
```

## Cross-Store Communication

```typescript
// stores/communication/message-bus.ts
import { defineStore } from 'pinia'
import type { StoreEvent } from '@/types'

export interface Message {
  id: string
  type: string
  from: string
  to?: string
  payload: any
  timestamp: Date
  handled: boolean
}

export const useMessageBus = defineStore('message-bus', () => {
  const messages = ref<Message[]>([])
  const handlers = ref<Map<string, Function[]>>(new Map())
  const middleware = ref<Function[]>([])
  
  // Send message
  function send(type: string, payload: any, options: {
    from: string
    to?: string
    priority?: 'low' | 'normal' | 'high'
  }) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      from: options.from,
      to: options.to,
      payload,
      timestamp: new Date(),
      handled: false
    }
    
    // Apply middleware
    let processedMessage = message
    for (const mw of middleware.value) {
      processedMessage = mw(processedMessage) || processedMessage
    }
    
    messages.value.push(processedMessage)
    
    // Handle message
    handleMessage(processedMessage)
    
    return message.id
  }
  
  // Handle message
  function handleMessage(message: Message) {
    const typeHandlers = handlers.value.get(message.type) || []
    const globalHandlers = handlers.value.get('*') || []
    
    const allHandlers = [...typeHandlers, ...globalHandlers]
    
    if (allHandlers.length === 0) {
      console.warn(`No handlers found for message type: ${message.type}`)
      return
    }
    
    allHandlers.forEach(handler => {
      try {
        handler(message)
        message.handled = true
      } catch (error) {
        console.error(`Error handling message ${message.id}:`, error)
      }
    })
  }
  
  // Subscribe to messages
  function subscribe(type: string, handler: Function) {
    const typeHandlers = handlers.value.get(type) || []
    typeHandlers.push(handler)
    handlers.value.set(type, typeHandlers)
    
    return () => unsubscribe(type, handler)
  }
  
  // Unsubscribe from messages
  function unsubscribe(type: string, handler: Function) {
    const typeHandlers = handlers.value.get(type) || []
    const index = typeHandlers.indexOf(handler)
    if (index > -1) {
      typeHandlers.splice(index, 1)
      handlers.value.set(type, typeHandlers)
    }
  }
  
  // Add middleware
  function addMiddleware(mw: Function) {
    middleware.value.push(mw)
    
    return () => {
      const index = middleware.value.indexOf(mw)
      if (index > -1) {
        middleware.value.splice(index, 1)
      }
    }
  }
  
  // Request-Response pattern
  function request(type: string, payload: any, options: {
    from: string
    timeout?: number
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const timeout = options.timeout || 5000
      
      // Set up response handler
      const unsubscribe = subscribe(`${type}:response`, (message: Message) => {
        if (message.payload.requestId === requestId) {
          unsubscribe()
          clearTimeout(timer)
          
          if (message.payload.error) {
            reject(new Error(message.payload.error))
          } else {
            resolve(message.payload.data)
          }
        }
      })
      
      // Set up timeout
      const timer = setTimeout(() => {
        unsubscribe()
        reject(new Error(`Request timeout after ${timeout}ms`))
      }, timeout)
      
      // Send request
      send(type, { ...payload, requestId }, options)
    })
  }
  
  // Respond to request
  function respond(requestMessage: Message, data: any, error?: string) {
    send(`${requestMessage.type}:response`, {
      requestId: requestMessage.payload.requestId,
      data,
      error
    }, {
      from: 'message-bus',
      to: requestMessage.from
    })
  }
  
  // Clear old messages
  function cleanup(maxAge = 60000) {
    const cutoff = new Date(Date.now() - maxAge)
    messages.value = messages.value.filter(msg => msg.timestamp > cutoff)
  }
  
  // Computed
  const messageCount = computed(() => messages.value.length)
  const unhandledMessages = computed(() => 
    messages.value.filter(msg => !msg.handled)
  )
  const recentMessages = computed(() => 
    messages.value.slice(-20).reverse()
  )
  
  return {
    // State
    messages: readonly(messages),
    
    // Actions
    send,
    subscribe,
    unsubscribe,
    addMiddleware,
    request,
    respond,
    cleanup,
    
    // Computed
    messageCount,
    unhandledMessages,
    recentMessages
  }
})
```

## Composed Store Example

```typescript
// stores/composed/e-commerce.ts
import { defineStore } from 'pinia'
import { useStoreRegistry } from '@stores/registry'
import { useMessageBus } from '@stores/communication/message-bus'
import { EntityStoreFactory } from '@stores/factories/base-factory'

// Product Store
export const useProductsStore = defineStore('products', () => {
  const registry = useStoreRegistry()
  const messageBus = useMessageBus()
  
  const factory = new EntityStoreFactory()
  const baseStore = factory.create({
    id: 'products',
    name: 'Products Store',
    entityName: 'product',
    apiEndpoint: '/api/products',
    initialState: {
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 }
    }
  })
  
  const store = baseStore()
  
  // Register with registry
  registry.registerStore({
    id: 'products',
    name: 'Products Store',
    permissions: ['read', 'write']
  }, store)
  
  // Subscribe to cart events
  messageBus.subscribe('cart:item-added', (message) => {
    const { productId, quantity } = message.payload
    updateProductStock(productId, -quantity)
  })
  
  messageBus.subscribe('cart:item-removed', (message) => {
    const { productId, quantity } = message.payload
    updateProductStock(productId, quantity)
  })
  
  // Additional actions
  async function updateProductStock(productId: string, change: number) {
    const product = store.items.find(p => p.id === productId)
    if (product) {
      product.stock += change
      
      // Notify other stores
      messageBus.send('product:stock-updated', {
        productId,
        newStock: product.stock,
        change
      }, { from: 'products' })
    }
  }
  
  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories')
      store.categories = await response.json()
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }
  
  return {
    ...store,
    updateProductStock,
    fetchCategories
  }
})

// Cart Store
export const useCartStore = defineStore('cart', () => {
  const registry = useStoreRegistry()
  const messageBus = useMessageBus()
  
  const items = ref<Array<{
    id: string
    productId: string
    quantity: number
    price: number
    addedAt: Date
  }>>([])
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Register with registry
  registry.registerStore({
    id: 'cart',
    name: 'Shopping Cart Store',
    dependencies: ['products'],
    permissions: ['read', 'write']
  }, { items, isLoading, error })
  
  // Subscribe to product events
  messageBus.subscribe('product:stock-updated', (message) => {
    const { productId, newStock } = message.payload
    
    // Remove items if out of stock
    if (newStock <= 0) {
      removeItem(productId)
    }
  })
  
  // Actions
  async function addItem(productId: string, quantity = 1) {
    try {
      // Check if product exists and has stock
      const response = await messageBus.request('products:get-product', {
        productId
      }, { from: 'cart' })
      
      const product = response.data
      if (!product || product.stock < quantity) {
        throw new Error('Insufficient stock')
      }
      
      const existingItem = items.value.find(item => item.productId === productId)
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        items.value.push({
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId,
          quantity,
          price: product.price,
          addedAt: new Date()
        })
      }
      
      // Notify other stores
      messageBus.send('cart:item-added', {
        productId,
        quantity
      }, { from: 'cart' })
      
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      throw error
    }
  }
  
  function removeItem(productId: string) {
    const itemIndex = items.value.findIndex(item => item.productId === productId)
    
    if (itemIndex > -1) {
      const item = items.value[itemIndex]
      items.value.splice(itemIndex, 1)
      
      // Notify other stores
      messageBus.send('cart:item-removed', {
        productId,
        quantity: item.quantity
      }, { from: 'cart' })
    }
  }
  
  function updateQuantity(productId: string, newQuantity: number) {
    const item = items.value.find(item => item.productId === productId)
    
    if (item) {
      const oldQuantity = item.quantity
      item.quantity = newQuantity
      
      const change = newQuantity - oldQuantity
      
      messageBus.send('cart:quantity-updated', {
        productId,
        oldQuantity,
        newQuantity,
        change
      }, { from: 'cart' })
    }
  }
  
  function clearCart() {
    const removedItems = [...items.value]
    items.value = []
    
    // Notify about all removed items
    removedItems.forEach(item => {
      messageBus.send('cart:item-removed', {
        productId: item.productId,
        quantity: item.quantity
      }, { from: 'cart' })
    })
  }
  
  // Computed
  const itemCount = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )
  
  const totalPrice = computed(() => 
    items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  )
  
  const isEmpty = computed(() => items.value.length === 0)
  
  return {
    // State
    items: readonly(items),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Computed
    itemCount,
    totalPrice,
    isEmpty
  }
})

// Order Store
export const useOrderStore = defineStore('order', () => {
  const registry = useStoreRegistry()
  const messageBus = useMessageBus()
  const cartStore = useCartStore()
  
  const orders = ref<any[]>([])
  const currentOrder = ref<any | null>(null)
  const isProcessing = ref(false)
  
  // Register with registry
  registry.registerStore({
    id: 'order',
    name: 'Order Store',
    dependencies: ['cart', 'products'],
    permissions: ['read', 'write']
  }, { orders, currentOrder, isProcessing })
  
  // Actions
  async function createOrder(orderData: any) {
    if (cartStore.isEmpty) {
      throw new Error('Cannot create order with empty cart')
    }
    
    isProcessing.value = true
    
    try {
      const order = {
        id: `order-${Date.now()}`,
        items: [...cartStore.items],
        total: cartStore.totalPrice,
        status: 'pending',
        createdAt: new Date(),
        ...orderData
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      orders.value.push(order)
      currentOrder.value = order
      
      // Clear cart after successful order
      cartStore.clearCart()
      
      // Notify other stores
      messageBus.send('order:created', {
        order
      }, { from: 'order' })
      
      return order
    } finally {
      isProcessing.value = false
    }
  }
  
  async function updateOrderStatus(orderId: string, status: string) {
    const order = orders.value.find(o => o.id === orderId)
    
    if (order) {
      order.status = status
      order.updatedAt = new Date()
      
      messageBus.send('order:status-updated', {
        orderId,
        status,
        order
      }, { from: 'order' })
    }
  }
  
  // Computed
  const orderCount = computed(() => orders.value.length)
  const pendingOrders = computed(() => 
    orders.value.filter(order => order.status === 'pending')
  )
  
  return {
    // State
    orders: readonly(orders),
    currentOrder: readonly(currentOrder),
    isProcessing: readonly(isProcessing),
    
    // Actions
    createOrder,
    updateOrderStatus,
    
    // Computed
    orderCount,
    pendingOrders
  }
})
```

## Store Composition Utilities

```typescript
// composables/use-store-composition.ts
import { useStoreRegistry } from '@stores/registry'
import { useMessageBus } from '@stores/communication/message-bus'

export function useStoreComposition() {
  const registry = useStoreRegistry()
  const messageBus = useMessageBus()
  
  // Compose multiple stores
  function composeStores<T extends Record<string, any>>(storeMap: T): T {
    const composed = {} as T
    
    Object.entries(storeMap).forEach(([key, storeFactory]) => {
      const store = typeof storeFactory === 'function' ? storeFactory() : storeFactory
      composed[key as keyof T] = store
    })
    
    return composed
  }
  
  // Create store with dependencies
  function createStoreWithDeps<T>(
    storeFactory: () => T,
    dependencies: string[]
  ): T {
    // Validate dependencies
    for (const dep of dependencies) {
      if (!registry.hasStore(dep)) {
        throw new Error(`Dependency '${dep}' not found`)
      }
    }
    
    return storeFactory()
  }
  
  // Create store proxy with access control
  function createSecureStore<T extends Record<string, any>>(
    store: T,
    permissions: string[]
  ): T {
    return new Proxy(store, {
      get(target, prop) {
        const propName = prop.toString()
        
        // Check if action requires permission
        if (typeof target[prop] === 'function' && propName.startsWith('$')) {
          if (!permissions.includes('admin') && !permissions.includes(propName)) {
            throw new Error(`Permission denied for action: ${propName}`)
          }
        }
        
        return target[prop]
      },
      
      set(target, prop, value) {
        const propName = prop.toString()
        
        // Check write permission
        if (!permissions.includes('write') && !permissions.includes('admin')) {
          throw new Error(`Write permission denied for property: ${propName}`)
        }
        
        target[prop] = value
        return true
      }
    })
  }
  
  // Store middleware
  function applyMiddleware<T>(
    store: T,
    middleware: Array<(store: T, action: string, args: any[]) => any>
  ): T {
    return new Proxy(store as any, {
      get(target, prop) {
        const value = target[prop]
        
        if (typeof value === 'function') {
          return (...args: any[]) => {
            // Apply middleware before action
            middleware.forEach(mw => {
              mw(store, prop.toString(), args)
            })
            
            const result = value.apply(target, args)
            
            // Handle async results
            if (result instanceof Promise) {
              return result.catch(error => {
                // Apply error middleware
                middleware.forEach(mw => {
                  if (mw.name === 'errorMiddleware') {
                    mw(store, prop.toString(), [error])
                  }
                })
                throw error
              })
            }
            
            return result
          }
        }
        
        return value
      }
    })
  }
  
  return {
    composeStores,
    createStoreWithDeps,
    createSecureStore,
    applyMiddleware
  }
}

// Store composition hook
export function useComposedStore<T extends Record<string, any>>(
  composition: () => T
): T {
  const stores = composition()
  
  // Set up cross-store reactivity
  Object.values(stores).forEach(store => {
    if (store && typeof store === 'object' && '$subscribe' in store) {
      store.$subscribe((mutation: any, state: any) => {
        // Handle cross-store state synchronization
        console.log(`Store ${store.$id} changed:`, mutation)
      })
    }
  })
  
  return stores
}
```

## Testing Composed Stores

```typescript
// stores/__tests__/composition.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductsStore, useCartStore, useOrderStore } from '@stores/composed/e-commerce'
import { useStoreRegistry } from '@stores/registry'
import { useMessageBus } from '@stores/communication/message-bus'

describe('Store Composition', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should register stores with dependencies', () => {
    const registry = useStoreRegistry()
    const productsStore = useProductsStore()
    const cartStore = useCartStore()
    
    expect(registry.hasStore('products')).toBe(true)
    expect(registry.hasStore('cart')).toBe(true)
    expect(registry.validateDependencies('cart')).toBe(true)
  })
  
  it('should handle cross-store communication', async () => {
    const messageBus = useMessageBus()
    const productsStore = useProductsStore()
    const cartStore = useCartStore()
    
    // Mock product data
    productsStore.items.push({
      id: 'product-1',
      name: 'Test Product',
      price: 10,
      stock: 5
    })
    
    // Add item to cart
    await cartStore.addItem('product-1', 2)
    
    // Check if product stock was updated
    const product = productsStore.items.find(p => p.id === 'product-1')
    expect(product?.stock).toBe(3)
  })
  
  it('should create order from cart', async () => {
    const productsStore = useProductsStore()
    const cartStore = useCartStore()
    const orderStore = useOrderStore()
    
    // Setup test data
    productsStore.items.push({
      id: 'product-1',
      name: 'Test Product',
      price: 10,
      stock: 5
    })
    
    await cartStore.addItem('product-1', 2)
    
    const order = await orderStore.createOrder({
      customerName: 'Test Customer',
      address: 'Test Address'
    })
    
    expect(order).toBeDefined()
    expect(order.items).toHaveLength(1)
    expect(order.total).toBe(20)
    expect(cartStore.isEmpty).toBe(true)
  })
  
  it('should handle store events', async () => {
    const messageBus = useMessageBus()
    const events: any[] = []
    
    messageBus.subscribe('*', (event) => {
      events.push(event)
    })
    
    const cartStore = useCartStore()
    const productsStore = useProductsStore()
    
    productsStore.items.push({
      id: 'product-1',
      name: 'Test Product',
      price: 10,
      stock: 5
    })
    
    await cartStore.addItem('product-1', 1)
    
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('cart:item-added')
  })
})
```

## Best Practices

1. **Dependency Management**: Always declare store dependencies explicitly
2. **Event-Driven Communication**: Use message bus for loose coupling
3. **Permission System**: Implement access control for sensitive operations
4. **Factory Patterns**: Use factories for creating similar stores
5. **Testing**: Test store composition and cross-store interactions
6. **Performance**: Monitor message bus performance and clean up old messages
7. **Documentation**: Document store relationships and communication patterns

This composition system provides a robust foundation for building complex, scalable applications with well-organized and maintainable store architecture.