# Store 组合模式

在复杂应用中组合和组织 Pinia store 的高级模式，演示模块化架构、依赖注入和跨 store 通信策略。

## 功能特性

- 🏗️ 模块化 store 架构
- 🔗 跨 store 通信模式
- 💉 Store 依赖注入
- 🎯 Store 工厂模式
- 🔄 事件驱动的 store 交互
- 📦 Store 模块和命名空间
- 🧩 可组合的 store 工具
- 🎨 高阶 store 模式
- 🔒 Store 访问控制和权限
- 🧪 测试组合 store

## 核心类型

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

## Store 注册系统

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
  
  // Store 注册
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
  
  // 依赖解析
  function resolveDependencies(storeId: string): any[] {
    const dependencies = registry.value.dependencies.get(storeId) || []
    const resolved: any[] = []
    
    for (const depId of dependencies) {
      const depStore = registry.value.stores.get(depId)
      if (!depStore) {
        throw new Error(`未找到 store '${storeId}' 的依赖 '${depId}'`)
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
  
  // 事件系统
  function emitEvent(event: StoreEvent) {
    events.value.push(event)
    
    // 限制事件历史
    if (events.value.length > 1000) {
      events.value = events.value.slice(-500)
    }
    
    // 通知监听器
    const listeners = eventListeners.value.get(event.type) || []
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error(`事件监听器 '${event.type}' 出错:`, error)
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
  
  // Store 访问
  function getStore<T = any>(storeId: string): T | undefined {
    return registry.value.stores.get(storeId)
  }
  
  function hasStore(storeId: string): boolean {
    return registry.value.stores.has(storeId)
  }
  
  function getAllStores(): Map<string, any> {
    return new Map(registry.value.stores)
  }
  
  // 权限系统
  function checkPermission(storeId: string, permission: string): boolean {
    const permissions = registry.value.permissions.get(storeId) || []
    return permissions.includes(permission) || permissions.includes('*')
  }
  
  // 计算属性
  const storeCount = computed(() => registry.value.stores.size)
  const registeredStores = computed(() => Array.from(registry.value.stores.keys()))
  const recentEvents = computed(() => events.value.slice(-10))
  
  return {
    // 状态
    registry: readonly(registry),
    events: readonly(events),
    
    // 操作
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
    
    // 计算属性
    storeCount,
    registeredStores,
    recentEvents
  }
})
```

## Store 工厂模式

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
      // 初始化状态
      const state = reactive(config.initialState || {})
      
      // 创建 getter
      const getters: Record<string, ComputedRef> = {}
      if (config.getters) {
        Object.entries(config.getters).forEach(([key, getter]) => {
          getters[key] = computed(() => getter(state))
        })
      }
      
      // 创建操作
      const actions: Record<string, Function> = {}
      if (config.actions) {
        Object.entries(config.actions).forEach(([key, action]) => {
          actions[key] = (...args: any[]) => action(state, ...args)
        })
      }
      
      // 添加通用操作
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
      // 如需要，进行额外清理
    }
  }
  
  configure(store: any, config: Partial<BaseStoreConfig>) {
    // 动态重新配置逻辑
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

// 实体 Store 工厂
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

## 跨 Store 通信

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
  
  // 发送消息
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
    
    // 应用中间件
    let processedMessage = message
    for (const mw of middleware.value) {
      processedMessage = mw(processedMessage) || processedMessage
    }
    
    messages.value.push(processedMessage)
    
    // 处理消息
    handleMessage(processedMessage)
    
    return message.id
  }
  
  // 处理消息
  function handleMessage(message: Message) {
    const typeHandlers = handlers.value.get(message.type) || []
    const globalHandlers = handlers.value.get('*') || []
    
    const allHandlers = [...typeHandlers, ...globalHandlers]
    
    if (allHandlers.length === 0) {
      console.warn(`未找到消息类型的处理器: ${message.type}`)
      return
    }
    
    allHandlers.forEach(handler => {
      try {
        handler(message)
        message.handled = true
      } catch (error) {
        console.error(`处理消息 ${message.id} 时出错:`, error)
      }
    })
  }
  
  // 订阅消息
  function subscribe(type: string, handler: Function) {
    const typeHandlers = handlers.value.get(type) || []
    typeHandlers.push(handler)
    handlers.value.set(type, typeHandlers)
    
    return () => unsubscribe(type, handler)
  }
  
  // 取消订阅消息
  function unsubscribe(type: string, handler: Function) {
    const typeHandlers = handlers.value.get(type) || []
    const index = typeHandlers.indexOf(handler)
    if (index > -1) {
      typeHandlers.splice(index, 1)
      handlers.value.set(type, typeHandlers)
    }
  }
  
  // 添加中间件
  function addMiddleware(mw: Function) {
    middleware.value.push(mw)
    
    return () => {
      const index = middleware.value.indexOf(mw)
      if (index > -1) {
        middleware.value.splice(index, 1)
      }
    }
  }
  
  // 请求-响应模式
  function request(type: string, payload: any, options: {
    from: string
    timeout?: number
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const timeout = options.timeout || 5000
      
      // 设置响应处理器
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
      
      // 设置超时
      const timer = setTimeout(() => {
        unsubscribe()
        reject(new Error(`请求在 ${timeout}ms 后超时`))
      }, timeout)
      
      // 发送请求
      send(type, { ...payload, requestId }, options)
    })
  }
  
  // 响应请求
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
  
  // 清理旧消息
  function cleanup(maxAge = 60000) {
    const cutoff = new Date(Date.now() - maxAge)
    messages.value = messages.value.filter(msg => msg.timestamp > cutoff)
  }
  
  // 计算属性
  const messageCount = computed(() => messages.value.length)
  const unhandledMessages = computed(() => 
    messages.value.filter(msg => !msg.handled)
  )
  const recentMessages = computed(() => 
    messages.value.slice(-20).reverse()
  )
  
  return {
    // 状态
    messages: readonly(messages),
    
    // 操作
    send,
    subscribe,
    unsubscribe,
    addMiddleware,
    request,
    respond,
    cleanup,
    
    // 计算属性
    messageCount,
    unhandledMessages,
    recentMessages
  }
})
```

## 组合 Store 示例

```typescript
// stores/composed/e-commerce.ts
import { defineStore } from 'pinia'
import { useStoreRegistry } from '@stores/registry'
import { useMessageBus } from '@stores/communication/message-bus'
import { EntityStoreFactory } from '@stores/factories/base-factory'

// 产品 Store
export const useProductsStore = defineStore('products', () => {
  const registry = useStoreRegistry()
  const messageBus = useMessageBus()
  
  const factory = new EntityStoreFactory()
  const baseStore = factory.create({
    id: 'products',
    name: '产品 Store',
    entityName: 'product',
    apiEndpoint: '/api/products',
    initialState: {
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 }
    }
  })
  
  const store = baseStore()
  
  // 在注册表中注册
  registry.registerStore({
    id: 'products',
    name: '产品 Store',
    permissions: ['read', 'write']
  }, store)
  
  // 订阅购物车事件
  messageBus.subscribe('cart:item-added', (message) => {
    const { productId, quantity } = message.payload
    updateProductStock(productId, -quantity)
  })
  
  messageBus.subscribe('cart:item-removed', (message) => {
    const { productId, quantity } = message.payload
    updateProductStock(productId, quantity)
  })
  
  // 额外操作
  async function updateProductStock(productId: string, change: number) {
    const product = store.items.find(p => p.id === productId)
    if (product) {
      product.stock += change
      
      // 通知其他 store
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
      console.error('获取分类失败:', error)
    }
  }
  
  return {
    ...store,
    updateProductStock,
    fetchCategories
  }
})

// 购物车 Store
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
  
  // 在注册表中注册
  registry.registerStore({
    id: 'cart',
    name: '购物车 Store',
    dependencies: ['products'],
    permissions: ['read', 'write']
  }, { items, isLoading, error })
  
  // 订阅产品事件
  messageBus.subscribe('product:stock-updated', (message) => {
    const { productId, newStock } = message.payload
    
    // 如果缺货则移除商品
    if (newStock <= 0) {
      removeItem(productId)
    }
  })
  
  // 操作
  async function addItem(productId: string, quantity = 1) {
    try {
      // 检查产品是否存在且有库存
      const response = await messageBus.request('products:get-product', {
        productId
      }, { from: 'cart' })
      
      const product = response.data
      if (!product || product.stock < quantity) {
        throw new Error('库存不足')
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
      
      // 通知其他 store
      messageBus.send('cart:item-added', {
        productId,
        quantity
      }, { from: 'cart' })
      
    } catch (error) {
      console.error('添加商品到购物车失败:', error)
      throw error
    }
  }
  
  function removeItem(productId: string) {
    const itemIndex = items.value.findIndex(item => item.productId === productId)
    
    if (itemIndex > -1) {
      const item = items.value[itemIndex]
      items.value.splice(itemIndex, 1)
      
      // 通知其他 store
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
    
    // 通知所有移除的商品
    removedItems.forEach(item => {
      messageBus.send('cart:item-removed', {
        productId: item.productId,
        quantity: item.quantity
      }, { from: 'cart' })
    })
  }
  
  // 计算属性
  const itemCount = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )
  
  const totalPrice = computed(() => 
    items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  )
  
  const isEmpty = computed(() => items.value.length === 0)
  
  return {
    // 状态
    items: readonly(items),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 操作
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // 计算属性
    itemCount,
    totalPrice,
    isEmpty
  }
})

// 订单 Store
export const useOrderStore = defineStore('order', () => {
  const registry = useStoreRegistry()
  const messageBus = useMessageBus()
  const cartStore = useCartStore()
  
  const orders = ref<any[]>([])
  const currentOrder = ref<any | null>(null)
  const isProcessing = ref(false)
  
  // 在注册表中注册
  registry.registerStore({
    id: 'order',
    name: '订单 Store',
    dependencies: ['cart', 'products'],
    permissions: ['read', 'write']
  }, { orders, currentOrder, isProcessing })
  
  // 操作
  async function createOrder(orderData: any) {
    if (cartStore.isEmpty) {
      throw new Error('无法创建空购物车的订单')
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
      
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      orders.value.push(order)
      currentOrder.value = order
      
      // 成功创建订单后清空购物车
      cartStore.clearCart()
      
      // 通知其他 store
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
  
  // 计算属性
  const orderCount = computed(() => orders.value.length)
  const pendingOrders = computed(() => 
    orders.value.filter(order => order.status === 'pending')
  )
  
  return {
    // 状态
    orders: readonly(orders),
    currentOrder: readonly(currentOrder),
    isProcessing: readonly(isProcessing),
    
    // 操作
    createOrder,
    updateOrderStatus,
    
    // 计算属性
    orderCount,
    pendingOrders
  }
})
```

## Store 组合工具

```typescript
// composables/use-store-composition.ts
import { useStoreRegistry } from '@stores/registry'
import { useMessageBus } from '@stores/communication/message-bus'

export function useStoreComposition() {
  const registry = useStoreRegistry()
  const messageBus = useMessageBus()
  
  // 组合多个 store
  function composeStores<T extends Record<string, any>>(storeMap: T): T {
    const composed = {} as T
    
    Object.entries(storeMap).forEach(([key, storeFactory]) => {
      const store = typeof storeFactory === 'function' ? storeFactory() : storeFactory
      composed[key as keyof T] = store
    })
    
    return composed
  }
  
  // 创建带依赖的 store
  function createStoreWithDeps<T>(
    storeFactory: () => T,
    dependencies: string[]
  ): T {
    // 验证依赖
    for (const dep of dependencies) {
      if (!registry.hasStore(dep)) {
        throw new Error(`未找到依赖 '${dep}'`)
      }
    }
    
    return storeFactory()
  }
  
  // 创建带访问控制的 store 代理
  function createSecureStore<T extends Record<string, any>>(
    store: T,
    permissions: string[]
  ): T {
    return new Proxy(store, {
      get(target, prop) {
        const propName = prop.toString()
        
        // 检查操作是否需要权限
        if (typeof target[prop] === 'function' && propName.startsWith('$')) {
          if (!permissions.includes('admin') && !permissions.includes(propName)) {
            throw new Error(`操作权限被拒绝: ${propName}`)
          }
        }
        
        return target[prop]
      },
      
      set(target, prop, value) {
        const propName = prop.toString()
        
        // 检查写权限
        if (!permissions.includes('write') && !permissions.includes('admin')) {
          throw new Error(`属性写权限被拒绝: ${propName}`)
        }
        
        target[prop] = value
        return true
      }
    })
  }
  
  // Store 中间件
  function applyMiddleware<T>(
    store: T,
    middleware: Array<(store: T, action: string, args: any[]) => any>
  ): T {
    return new Proxy(store as any, {
      get(target, prop) {
        const value = target[prop]
        
        if (typeof value === 'function') {
          return (...args: any[]) => {
            // 在操作前应用中间件
            middleware.forEach(mw => {
              mw(store, prop.toString(), args)
            })
            
            const result = value.apply(target, args)
            
            // 处理异步结果
            if (result instanceof Promise) {
              return result.catch(error => {
                // 应用错误中间件
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

// Store 组合钩子
export function useComposedStore<T extends Record<string, any>>(
  composition: () => T
): T {
  const stores = composition()
  
  // 设置跨 store 响应性
  Object.values(stores).forEach(store => {
    if (store && typeof store === 'object' && '$subscribe' in store) {
      store.$subscribe((mutation: any, state: any) => {
        // 处理跨 store 状态同步
        console.log(`Store ${store.$id} 发生变化:`, mutation)
      })
    }
  })
  
  return stores
}
```

## 测试组合 Store

```typescript
// stores/__tests__/composition.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductsStore, useCartStore, useOrderStore } from '@stores/composed/e-commerce'
import { useStoreRegistry } from '@stores/registry'
import { useMessageBus } from '@stores/communication/message-bus'

describe('Store 组合', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('应该注册带依赖的 store', () => {
    const registry = useStoreRegistry()
    const productsStore = useProductsStore()
    const cartStore = useCartStore()
    
    expect(registry.hasStore('products')).toBe(true)
    expect(registry.hasStore('cart')).toBe(true)
    expect(registry.validateDependencies('cart')).toBe(true)
  })
  
  it('应该处理跨 store 通信', async () => {
    const messageBus = useMessageBus()
    const productsStore = useProductsStore()
    const cartStore = useCartStore()
    
    // 模拟产品数据
    productsStore.items.push({
      id: 'product-1',
      name: '测试产品',
      price: 10,
      stock: 5
    })
    
    // 添加商品到购物车
    await cartStore.addItem('product-1', 2)
    
    // 检查产品库存是否更新
    const product = productsStore.items.find(p => p.id === 'product-1')
    expect(product?.stock).toBe(3)
  })
  
  it('应该从购物车创建订单', async () => {
    const productsStore = useProductsStore()
    const cartStore = useCartStore()
    const orderStore = useOrderStore()
    
    // 设置测试数据
    productsStore.items.push({
      id: 'product-1',
      name: '测试产品',
      price: 10,
      stock: 5
    })
    
    await cartStore.addItem('product-1', 2)
    
    const order = await orderStore.createOrder({
      customerName: '测试客户',
      address: '测试地址'
    })
    
    expect(order).toBeDefined()
    expect(order.items).toHaveLength(1)
    expect(order.total).toBe(20)
    expect(cartStore.isEmpty).toBe(true)
  })
  
  it('应该处理 store 事件', async () => {
    const messageBus = useMessageBus()
    const events: any[] = []
    
    messageBus.subscribe('*', (event) => {
      events.push(event)
    })
    
    const cartStore = useCartStore()
    const productsStore = useProductsStore()
    
    productsStore.items.push({
      id: 'product-1',
      name: '测试产品',
      price: 10,
      stock: 5
    })
    
    await cartStore.addItem('product-1', 1)
    
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('cart:item-added')
  })
})
```

## 最佳实践

1. **依赖管理**: 始终明确声明 store 依赖关系
2. **事件驱动通信**: 使用消息总线实现松耦合
3. **权限系统**: 为敏感操作实现访问控制
4. **工厂模式**: 使用工厂创建相似的 store
5. **测试**: 测试 store 组合和跨 store 交互
6. **性能**: 监控消息总线性能并清理旧消息
7. **文档**: 记录 store 关系和通信模式

这个组合系统为构建复杂、可扩展的应用提供了坚实的基础，具有良好组织和可维护的 store 架构。