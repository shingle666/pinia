---
title: 购物车 Store 示例
description: 一个全面的电商购物车示例，展示了高级 Pinia 模式，包括跨 Store 通信、异步操作和复杂状态管理。
head:
  - [meta, { name: description, content: "一个全面的电商购物车示例，展示了高级 Pinia 模式，包括跨 Store 通信、异步操作和复杂状态管理。" }]
  - [meta, { name: keywords, content: "Pinia 购物车, 电商状态管理, Vue Store 模式" }]
---

# 购物车 Store 示例

这个示例展示了使用 Pinia 实现的真实电商购物车。它展示了高级模式，包括跨 Store 通信、异步操作、乐观更新和复杂业务逻辑。

## 概述

购物车示例演示了：

- 购物车、商品和用户 Store 之间的跨 Store 通信
- 带有加载状态和错误处理的异步操作
- 更好用户体验的乐观更新
- 复杂计算（税费、折扣、运费）
- 库存管理
- 购物车状态持久化
- 实时价格更新

## 功能特性

- ✅ 添加/移除购物车商品
- ✅ 更新商品数量
- ✅ 应用折扣码
- ✅ 计算税费和运费
- ✅ 库存验证
- ✅ 游客和认证用户购物车
- ✅ 购物车持久化
- ✅ 价格变动通知
- ✅ 批量操作
- ✅ 购物车放弃恢复

## 类型定义

```ts
// types/cart.ts
export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  image: string
  category: string
  stock: number
  sku: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
  addedAt: Date
  selectedVariant?: ProductVariant
  customizations?: Record<string, any>
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  attributes: Record<string, string>
}

export interface DiscountCode {
  code: string
  type: 'percentage' | 'fixed' | 'shipping'
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  expiresAt?: Date
  usageLimit?: number
  usedCount: number
}

export interface ShippingOption {
  id: string
  name: string
  price: number
  estimatedDays: number
  description: string
}

export interface CartSummary {
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  itemCount: number
  weight: number
}
```

## 商品 Store

```ts
// stores/products.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product } from '../types/cart'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const getProduct = computed(() => {
    return (id: string) => products.value.find(p => p.id === id)
  })
  
  const getProductsByCategory = computed(() => {
    return (category: string) => products.value.filter(p => p.category === category)
  })
  
  const fetchProducts = async () => {
    loading.value = true
    error.value = null
    
    try {
      // 模拟 API 调用
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('获取商品失败')
      
      products.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
    } finally {
      loading.value = false
    }
  }
  
  const updateProductStock = (productId: string, newStock: number) => {
    const product = products.value.find(p => p.id === productId)
    if (product) {
      product.stock = newStock
    }
  }
  
  return {
    products: readonly(products),
    loading: readonly(loading),
    error: readonly(error),
    getProduct,
    getProductsByCategory,
    fetchProducts,
    updateProductStock
  }
})
```

## 购物车 Store

```ts
// stores/cart.ts
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useProductsStore } from './products'
import { useUserStore } from './user'
import type { CartItem, Product, DiscountCode, ShippingOption, CartSummary } from '../types/cart'

export const useCartStore = defineStore('cart', () => {
  const productsStore = useProductsStore()
  const userStore = useUserStore()
  
  // 状态
  const items = ref<CartItem[]>([])
  const appliedDiscountCode = ref<DiscountCode | null>(null)
  const selectedShippingOption = ref<ShippingOption | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncedAt = ref<Date | null>(null)
  
  // 可用的配送选项
  const shippingOptions = ref<ShippingOption[]>([
    {
      id: 'standard',
      name: '标准配送',
      price: 5.99,
      estimatedDays: 5,
      description: '5-7 个工作日'
    },
    {
      id: 'express',
      name: '快速配送',
      price: 12.99,
      estimatedDays: 2,
      description: '2-3 个工作日'
    },
    {
      id: 'overnight',
      name: '隔夜配送',
      price: 24.99,
      estimatedDays: 1,
      description: '下一个工作日'
    }
  ])
  
  // 计算属性
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })
  
  const totalWeight = computed(() => {
    return items.value.reduce((total, item) => {
      return total + (item.product.weight * item.quantity)
    }, 0)
  })
  
  const subtotal = computed(() => {
    return items.value.reduce((total, item) => {
      const price = item.selectedVariant?.price || item.product.price
      return total + (price * item.quantity)
    }, 0)
  })
  
  const discountAmount = computed(() => {
    if (!appliedDiscountCode.value) return 0
    
    const discount = appliedDiscountCode.value
    const subtotalValue = subtotal.value
    
    if (discount.minOrderAmount && subtotalValue < discount.minOrderAmount) {
      return 0
    }
    
    let discountValue = 0
    
    if (discount.type === 'percentage') {
      discountValue = subtotalValue * (discount.value / 100)
    } else if (discount.type === 'fixed') {
      discountValue = discount.value
    }
    
    if (discount.maxDiscount) {
      discountValue = Math.min(discountValue, discount.maxDiscount)
    }
    
    return Math.min(discountValue, subtotalValue)
  })
  
  const taxAmount = computed(() => {
    const taxableAmount = subtotal.value - discountAmount.value
    const taxRate = userStore.user?.address?.state === 'CA' ? 0.0875 : 0.06
    return taxableAmount * taxRate
  })
  
  const shippingAmount = computed(() => {
    if (appliedDiscountCode.value?.type === 'shipping') {
      return 0
    }
    
    if (subtotal.value >= 50) {
      return 0 // 满 $50 免运费
    }
    
    return selectedShippingOption.value?.price || 0
  })
  
  const total = computed(() => {
    return subtotal.value - discountAmount.value + taxAmount.value + shippingAmount.value
  })
  
  const summary = computed<CartSummary>(() => ({
    subtotal: subtotal.value,
    discount: discountAmount.value,
    tax: taxAmount.value,
    shipping: shippingAmount.value,
    total: total.value,
    itemCount: itemCount.value,
    weight: totalWeight.value
  }))
  
  const isEmpty = computed(() => items.value.length === 0)
  
  const hasOutOfStockItems = computed(() => {
    return items.value.some(item => {
      const currentStock = item.selectedVariant?.stock || item.product.stock
      return item.quantity > currentStock
    })
  })
  
  // 操作方法
  const addItem = async (product: Product, quantity = 1, variant?: any) => {
    loading.value = true
    error.value = null
    
    try {
      // 检查库存可用性
      const availableStock = variant?.stock || product.stock
      if (quantity > availableStock) {
        throw new Error(`库存仅剩 ${availableStock} 件`)
      }
      
      const existingItemIndex = items.value.findIndex(item => 
        item.productId === product.id && 
        item.selectedVariant?.id === variant?.id
      )
      
      if (existingItemIndex !== -1) {
        // 更新现有商品
        const existingItem = items.value[existingItemIndex]
        const newQuantity = existingItem.quantity + quantity
        
        if (newQuantity > availableStock) {
          throw new Error(`无法添加更多商品。仅剩 ${availableStock} 件可用。`)
        }
        
        await updateItemQuantity(existingItem.id, newQuantity)
      } else {
        // 添加新商品
        const cartItem: CartItem = {
          id: generateId(),
          productId: product.id,
          product,
          quantity,
          addedAt: new Date(),
          selectedVariant: variant
        }
        
        items.value.push(cartItem)
      }
      
      await syncCart()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加商品失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const removeItem = async (itemId: string) => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      items.value.splice(index, 1)
      await syncCart()
    }
  }
  
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    const item = items.value.find(item => item.id === itemId)
    if (!item) return
    
    if (quantity <= 0) {
      await removeItem(itemId)
      return
    }
    
    // 检查库存可用性
    const availableStock = item.selectedVariant?.stock || item.product.stock
    if (quantity > availableStock) {
      throw new Error(`库存仅剩 ${availableStock} 件`)
    }
    
    item.quantity = quantity
    await syncCart()
  }
  
  const clearCart = async () => {
    items.value = []
    appliedDiscountCode.value = null
    selectedShippingOption.value = null
    await syncCart()
  }
  
  const applyDiscountCode = async (code: string) => {
    loading.value = true
    error.value = null
    
    try {
      // 模拟 API 调用验证折扣码
      const response = await fetch(`/api/discount-codes/${code}`)
      if (!response.ok) {
        throw new Error('无效的折扣码')
      }
      
      const discountCode: DiscountCode = await response.json()
      
      // 验证折扣码
      if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
        throw new Error('折扣码已过期')
      }
      
      if (discountCode.usageLimit && discountCode.usedCount >= discountCode.usageLimit) {
        throw new Error('折扣码使用次数已达上限')
      }
      
      if (discountCode.minOrderAmount && subtotal.value < discountCode.minOrderAmount) {
        throw new Error(`需要满 $${discountCode.minOrderAmount} 才能使用此折扣码`)
      }
      
      appliedDiscountCode.value = discountCode
      await syncCart()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '应用折扣码失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const removeDiscountCode = async () => {
    appliedDiscountCode.value = null
    await syncCart()
  }
  
  const setShippingOption = async (optionId: string) => {
    const option = shippingOptions.value.find(opt => opt.id === optionId)
    if (option) {
      selectedShippingOption.value = option
      await syncCart()
    }
  }
  
  const validateCart = async () => {
    const validationErrors: string[] = []
    
    for (const item of items.value) {
      // 刷新商品数据
      const currentProduct = productsStore.getProduct(item.productId)
      if (!currentProduct) {
        validationErrors.push(`商品 ${item.product.name} 已不可用`)
        continue
      }
      
      // 检查库存
      const availableStock = item.selectedVariant?.stock || currentProduct.stock
      if (item.quantity > availableStock) {
        validationErrors.push(
          `${item.product.name} 仅剩 ${availableStock} 件（您的购物车中有 ${item.quantity} 件）`
        )
      }
      
      // 检查价格变动
      const currentPrice = item.selectedVariant?.price || currentProduct.price
      const cartPrice = item.selectedVariant?.price || item.product.price
      if (currentPrice !== cartPrice) {
        validationErrors.push(
          `${item.product.name} 的价格已从 $${cartPrice} 变更为 $${currentPrice}`
        )
      }
    }
    
    return validationErrors
  }
  
  const refreshPrices = async () => {
    for (const item of items.value) {
      const currentProduct = productsStore.getProduct(item.productId)
      if (currentProduct) {
        item.product = { ...currentProduct }
      }
    }
    await syncCart()
  }
  
  const syncCart = async () => {
    if (userStore.isAuthenticated) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userStore.token}`
          },
          body: JSON.stringify({
            items: items.value,
            discountCode: appliedDiscountCode.value,
            shippingOption: selectedShippingOption.value
          })
        })
        lastSyncedAt.value = new Date()
      } catch (err) {
        console.error('同步购物车失败:', err)
      }
    } else {
      // 为游客用户保存到 localStorage
      localStorage.setItem('guest-cart', JSON.stringify({
        items: items.value,
        discountCode: appliedDiscountCode.value,
        shippingOption: selectedShippingOption.value
      }))
    }
  }
  
  const loadCart = async () => {
    if (userStore.isAuthenticated) {
      try {
        const response = await fetch('/api/cart', {
          headers: {
            'Authorization': `Bearer ${userStore.token}`
          }
        })
        
        if (response.ok) {
          const cartData = await response.json()
          items.value = cartData.items || []
          appliedDiscountCode.value = cartData.discountCode || null
          selectedShippingOption.value = cartData.shippingOption || null
        }
      } catch (err) {
        console.error('加载购物车失败:', err)
      }
    } else {
      // 为游客用户从 localStorage 加载
      const savedCart = localStorage.getItem('guest-cart')
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart)
          items.value = cartData.items || []
          appliedDiscountCode.value = cartData.discountCode || null
          selectedShippingOption.value = cartData.shippingOption || null
        } catch (err) {
          console.error('解析保存的购物车失败:', err)
        }
      }
    }
  }
  
  const mergeGuestCart = async () => {
    const guestCart = localStorage.getItem('guest-cart')
    if (guestCart) {
      try {
        const guestCartData = JSON.parse(guestCart)
        
        // 将游客购物车商品与认证用户购物车合并
        for (const guestItem of guestCartData.items || []) {
          await addItem(guestItem.product, guestItem.quantity, guestItem.selectedVariant)
        }
        
        // 清除游客购物车
        localStorage.removeItem('guest-cart')
      } catch (err) {
        console.error('合并游客购物车失败:', err)
      }
    }
  }
  
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // 监听用户认证状态变化
  watch(
    () => userStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        await mergeGuestCart()
        await loadCart()
      } else {
        await syncCart() // 保存到 localStorage
      }
    }
  )
  
  // 初始化购物车
  loadCart()
  
  return {
    // 状态
    items: readonly(items),
    appliedDiscountCode: readonly(appliedDiscountCode),
    selectedShippingOption: readonly(selectedShippingOption),
    shippingOptions: readonly(shippingOptions),
    loading: readonly(loading),
    error: readonly(error),
    lastSyncedAt: readonly(lastSyncedAt),
    
    // 计算属性
    itemCount,
    totalWeight,
    subtotal,
    discountAmount,
    taxAmount,
    shippingAmount,
    total,
    summary,
    isEmpty,
    hasOutOfStockItems,
    
    // 操作方法
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    applyDiscountCode,
    removeDiscountCode,
    setShippingOption,
    validateCart,
    refreshPrices,
    syncCart,
    loadCart
  }
})
```

## 组件使用

### 购物车组件

```vue
<!-- components/ShoppingCart.vue -->
<template>
  <div class="shopping-cart">
    <div class="cart-header">
      <h2>购物车</h2>
      <span class="item-count">{{ store.itemCount }} 件商品</span>
    </div>
    
    <div v-if="store.isEmpty" class="empty-cart">
      <p>您的购物车是空的</p>
      <router-link to="/products" class="continue-shopping">
        继续购物
      </router-link>
    </div>
    
    <div v-else class="cart-content">
      <div class="cart-items">
        <CartItem
          v-for="item in store.items"
          :key="item.id"
          :item="item"
          @update-quantity="handleUpdateQuantity"
          @remove="store.removeItem"
        />
      </div>
      
      <div class="cart-actions">
        <button @click="validateAndRefresh" :disabled="store.loading">
          验证并刷新价格
        </button>
        
        <button @click="store.clearCart" class="clear-cart">
          清空购物车
        </button>
      </div>
      
      <DiscountCodeForm
        :applied-code="store.appliedDiscountCode"
        @apply="handleApplyDiscount"
        @remove="store.removeDiscountCode"
      />
      
      <ShippingOptions
        :options="store.shippingOptions"
        :selected="store.selectedShippingOption"
        @select="store.setShippingOption"
      />
      
      <CartSummary :summary="store.summary" />
      
      <div class="checkout-actions">
        <button 
          @click="proceedToCheckout"
          :disabled="store.hasOutOfStockItems || store.loading"
          class="checkout-btn"
        >
          去结算
        </button>
      </div>
    </div>
    
    <div v-if="validationErrors.length" class="validation-errors">
      <h3>购物车问题：</h3>
      <ul>
        <li v-for="error in validationErrors" :key="error">
          {{ error }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../stores/cart'
import CartItem from './CartItem.vue'
import DiscountCodeForm from './DiscountCodeForm.vue'
import ShippingOptions from './ShippingOptions.vue'
import CartSummary from './CartSummary.vue'

const store = useCartStore()
const validationErrors = ref<string[]>([])

const handleUpdateQuantity = async (itemId: string, quantity: number) => {
  try {
    await store.updateItemQuantity(itemId, quantity)
  } catch (error) {
    console.error('更新数量失败:', error)
  }
}

const handleApplyDiscount = async (code: string) => {
  try {
    await store.applyDiscountCode(code)
  } catch (error) {
    console.error('应用折扣失败:', error)
  }
}

const validateAndRefresh = async () => {
  try {
    validationErrors.value = await store.validateCart()
    await store.refreshPrices()
  } catch (error) {
    console.error('验证购物车失败:', error)
  }
}

const proceedToCheckout = () => {
  // 导航到结算页面
  console.log('进入结算页面:', store.summary)
}
</script>
```

## 测试

```ts
// tests/cart.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import { useUserStore } from '../stores/user'

// 模拟 fetch
global.fetch = vi.fn()

describe('购物车 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })
  
  it('添加商品到购物车', async () => {
    const cartStore = useCartStore()
    const product = {
      id: '1',
      name: '测试商品',
      price: 29.99,
      stock: 10,
      // ... 其他商品属性
    }
    
    await cartStore.addItem(product, 2)
    
    expect(cartStore.items).toHaveLength(1)
    expect(cartStore.items[0].quantity).toBe(2)
    expect(cartStore.itemCount).toBe(2)
    expect(cartStore.subtotal).toBe(59.98)
  })
  
  it('更新商品数量', async () => {
    const cartStore = useCartStore()
    const product = {
      id: '1',
      name: '测试商品',
      price: 29.99,
      stock: 10,
      // ... 其他商品属性
    }
    
    await cartStore.addItem(product, 1)
    const itemId = cartStore.items[0].id
    
    await cartStore.updateItemQuantity(itemId, 3)
    
    expect(cartStore.items[0].quantity).toBe(3)
    expect(cartStore.subtotal).toBe(89.97)
  })
  
  it('从购物车移除商品', async () => {
    const cartStore = useCartStore()
    const product = {
      id: '1',
      name: '测试商品',
      price: 29.99,
      stock: 10,
      // ... 其他商品属性
    }
    
    await cartStore.addItem(product, 1)
    const itemId = cartStore.items[0].id
    
    await cartStore.removeItem(itemId)
    
    expect(cartStore.items).toHaveLength(0)
    expect(cartStore.isEmpty).toBe(true)
  })
  
  it('正确计算总价', async () => {
    const cartStore = useCartStore()
    const userStore = useUserStore()
    
    // 设置用户状态用于税费计算
    userStore.user = {
      address: { state: 'CA' }
    }
    
    const product = {
      id: '1',
      name: '测试商品',
      price: 100,
      stock: 10,
      weight: 1,
      // ... 其他商品属性
    }
    
    await cartStore.addItem(product, 1)
    await cartStore.setShippingOption('standard')
    
    expect(cartStore.subtotal).toBe(100)
    expect(cartStore.taxAmount).toBe(8.75) // 8.75% CA 税
    expect(cartStore.shippingAmount).toBe(0) // 满 $50 免运费
    expect(cartStore.total).toBe(108.75)
  })
  
  it('正确应用折扣码', async () => {
    const cartStore = useCartStore()
    
    // 模拟成功的折扣码响应
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minOrderAmount: 50
      })
    } as Response)
    
    const product = {
      id: '1',
      name: '测试商品',
      price: 100,
      stock: 10,
      // ... 其他商品属性
    }
    
    await cartStore.addItem(product, 1)
    await cartStore.applyDiscountCode('SAVE10')
    
    expect(cartStore.appliedDiscountCode?.code).toBe('SAVE10')
    expect(cartStore.discountAmount).toBe(10)
  })
})
```

## 核心概念

### 1. 跨 Store 通信
购物车 Store 与商品和用户 Store 通信以获取当前数据和用户偏好。

### 2. 异步操作
所有购物车操作都是异步的，以支持 API 调用和适当的错误处理。

### 3. 乐观更新
UI 立即更新，同时在后台与服务器同步。

### 4. 复杂业务逻辑
处理税费、折扣、运费计算和库存验证。

### 5. 状态持久化
支持认证用户（服务器同步）和游客用户（localStorage）。

## 最佳实践

1. **验证数据** 在执行操作前验证数据
2. **优雅处理错误** 提供用户友好的错误消息
3. **同步状态** 在客户端和服务器之间同步状态
4. **使用乐观更新** 提供更好的用户体验
5. **实现适当的加载状态**
6. **彻底测试复杂业务逻辑**
7. **考虑离线场景**

## 相关内容

- [组合 Store](../guide/composing-stores.md)
- [插件](../guide/plugins.md)
- [测试](../guide/testing.md)
- [SSR](../guide/ssr.md)