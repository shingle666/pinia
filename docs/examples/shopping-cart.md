---
title: Shopping Cart Store Example
description: A comprehensive e-commerce shopping cart example demonstrating advanced Pinia patterns including cross-store communication, async actions, and complex state management.
head:
  - [meta, { name: description, content: "A comprehensive e-commerce shopping cart example demonstrating advanced Pinia patterns including cross-store communication, async actions, and complex state management." }]
  - [meta, { name: keywords, content: "Pinia shopping cart, e-commerce state management, Vue store patterns" }]
---

# Shopping Cart Store Example

This example demonstrates a real-world e-commerce shopping cart implementation using Pinia. It showcases advanced patterns including cross-store communication, async operations, optimistic updates, and complex business logic.

## Overview

The shopping cart example illustrates:

- Cross-store communication between cart, products, and user stores
- Async operations with loading states and error handling
- Optimistic updates for better UX
- Complex calculations (taxes, discounts, shipping)
- Inventory management
- Persistent cart state
- Real-time price updates

## Features

- ✅ Add/remove items from cart
- ✅ Update item quantities
- ✅ Apply discount codes
- ✅ Calculate taxes and shipping
- ✅ Inventory validation
- ✅ Guest and authenticated user carts
- ✅ Cart persistence
- ✅ Price change notifications
- ✅ Bulk operations
- ✅ Cart abandonment recovery

## Types Definition

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

## Products Store

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
      // Simulate API call
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      
      products.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
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

## Shopping Cart Store

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
  
  // State
  const items = ref<CartItem[]>([])
  const appliedDiscountCode = ref<DiscountCode | null>(null)
  const selectedShippingOption = ref<ShippingOption | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncedAt = ref<Date | null>(null)
  
  // Available shipping options
  const shippingOptions = ref<ShippingOption[]>([
    {
      id: 'standard',
      name: 'Standard Shipping',
      price: 5.99,
      estimatedDays: 5,
      description: '5-7 business days'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      price: 12.99,
      estimatedDays: 2,
      description: '2-3 business days'
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      price: 24.99,
      estimatedDays: 1,
      description: 'Next business day'
    }
  ])
  
  // Getters
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
      return 0 // Free shipping over $50
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
  
  // Actions
  const addItem = async (product: Product, quantity = 1, variant?: any) => {
    loading.value = true
    error.value = null
    
    try {
      // Check stock availability
      const availableStock = variant?.stock || product.stock
      if (quantity > availableStock) {
        throw new Error(`Only ${availableStock} items available in stock`)
      }
      
      const existingItemIndex = items.value.findIndex(item => 
        item.productId === product.id && 
        item.selectedVariant?.id === variant?.id
      )
      
      if (existingItemIndex !== -1) {
        // Update existing item
        const existingItem = items.value[existingItemIndex]
        const newQuantity = existingItem.quantity + quantity
        
        if (newQuantity > availableStock) {
          throw new Error(`Cannot add more items. Only ${availableStock} available.`)
        }
        
        await updateItemQuantity(existingItem.id, newQuantity)
      } else {
        // Add new item
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
      error.value = err instanceof Error ? err.message : 'Failed to add item'
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
    
    // Check stock availability
    const availableStock = item.selectedVariant?.stock || item.product.stock
    if (quantity > availableStock) {
      throw new Error(`Only ${availableStock} items available in stock`)
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
      // Simulate API call to validate discount code
      const response = await fetch(`/api/discount-codes/${code}`)
      if (!response.ok) {
        throw new Error('Invalid discount code')
      }
      
      const discountCode: DiscountCode = await response.json()
      
      // Validate discount code
      if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
        throw new Error('Discount code has expired')
      }
      
      if (discountCode.usageLimit && discountCode.usedCount >= discountCode.usageLimit) {
        throw new Error('Discount code usage limit reached')
      }
      
      if (discountCode.minOrderAmount && subtotal.value < discountCode.minOrderAmount) {
        throw new Error(`Minimum order amount of $${discountCode.minOrderAmount} required`)
      }
      
      appliedDiscountCode.value = discountCode
      await syncCart()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to apply discount code'
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
      // Refresh product data
      const currentProduct = productsStore.getProduct(item.productId)
      if (!currentProduct) {
        validationErrors.push(`Product ${item.product.name} is no longer available`)
        continue
      }
      
      // Check stock
      const availableStock = item.selectedVariant?.stock || currentProduct.stock
      if (item.quantity > availableStock) {
        validationErrors.push(
          `Only ${availableStock} of ${item.product.name} available (you have ${item.quantity})`
        )
      }
      
      // Check price changes
      const currentPrice = item.selectedVariant?.price || currentProduct.price
      const cartPrice = item.selectedVariant?.price || item.product.price
      if (currentPrice !== cartPrice) {
        validationErrors.push(
          `Price of ${item.product.name} has changed from $${cartPrice} to $${currentPrice}`
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
        console.error('Failed to sync cart:', err)
      }
    } else {
      // Save to localStorage for guest users
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
        console.error('Failed to load cart:', err)
      }
    } else {
      // Load from localStorage for guest users
      const savedCart = localStorage.getItem('guest-cart')
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart)
          items.value = cartData.items || []
          appliedDiscountCode.value = cartData.discountCode || null
          selectedShippingOption.value = cartData.shippingOption || null
        } catch (err) {
          console.error('Failed to parse saved cart:', err)
        }
      }
    }
  }
  
  const mergeGuestCart = async () => {
    const guestCart = localStorage.getItem('guest-cart')
    if (guestCart) {
      try {
        const guestCartData = JSON.parse(guestCart)
        
        // Merge guest cart items with authenticated cart
        for (const guestItem of guestCartData.items || []) {
          await addItem(guestItem.product, guestItem.quantity, guestItem.selectedVariant)
        }
        
        // Clear guest cart
        localStorage.removeItem('guest-cart')
      } catch (err) {
        console.error('Failed to merge guest cart:', err)
      }
    }
  }
  
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // Watch for user authentication changes
  watch(
    () => userStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        await mergeGuestCart()
        await loadCart()
      } else {
        await syncCart() // Save to localStorage
      }
    }
  )
  
  // Initialize cart
  loadCart()
  
  return {
    // State
    items: readonly(items),
    appliedDiscountCode: readonly(appliedDiscountCode),
    selectedShippingOption: readonly(selectedShippingOption),
    shippingOptions: readonly(shippingOptions),
    loading: readonly(loading),
    error: readonly(error),
    lastSyncedAt: readonly(lastSyncedAt),
    
    // Getters
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
    
    // Actions
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

## Component Usage

### Shopping Cart Component

```vue
<!-- components/ShoppingCart.vue -->
<template>
  <div class="shopping-cart">
    <div class="cart-header">
      <h2>Shopping Cart</h2>
      <span class="item-count">{{ store.itemCount }} items</span>
    </div>
    
    <div v-if="store.isEmpty" class="empty-cart">
      <p>Your cart is empty</p>
      <router-link to="/products" class="continue-shopping">
        Continue Shopping
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
          Validate & Refresh Prices
        </button>
        
        <button @click="store.clearCart" class="clear-cart">
          Clear Cart
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
          Proceed to Checkout
        </button>
      </div>
    </div>
    
    <div v-if="validationErrors.length" class="validation-errors">
      <h3>Cart Issues:</h3>
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
    console.error('Failed to update quantity:', error)
  }
}

const handleApplyDiscount = async (code: string) => {
  try {
    await store.applyDiscountCode(code)
  } catch (error) {
    console.error('Failed to apply discount:', error)
  }
}

const validateAndRefresh = async () => {
  try {
    validationErrors.value = await store.validateCart()
    await store.refreshPrices()
  } catch (error) {
    console.error('Failed to validate cart:', error)
  }
}

const proceedToCheckout = () => {
  // Navigate to checkout
  console.log('Proceeding to checkout with:', store.summary)
}
</script>
```

## Testing

```ts
// tests/cart.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import { useUserStore } from '../stores/user'

// Mock fetch
global.fetch = vi.fn()

describe('Shopping Cart Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })
  
  it('adds item to cart', async () => {
    const cartStore = useCartStore()
    const product = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      stock: 10,
      // ... other product properties
    }
    
    await cartStore.addItem(product, 2)
    
    expect(cartStore.items).toHaveLength(1)
    expect(cartStore.items[0].quantity).toBe(2)
    expect(cartStore.itemCount).toBe(2)
    expect(cartStore.subtotal).toBe(59.98)
  })
  
  it('updates item quantity', async () => {
    const cartStore = useCartStore()
    const product = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      stock: 10,
      // ... other product properties
    }
    
    await cartStore.addItem(product, 1)
    const itemId = cartStore.items[0].id
    
    await cartStore.updateItemQuantity(itemId, 3)
    
    expect(cartStore.items[0].quantity).toBe(3)
    expect(cartStore.subtotal).toBe(89.97)
  })
  
  it('removes item from cart', async () => {
    const cartStore = useCartStore()
    const product = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      stock: 10,
      // ... other product properties
    }
    
    await cartStore.addItem(product, 1)
    const itemId = cartStore.items[0].id
    
    await cartStore.removeItem(itemId)
    
    expect(cartStore.items).toHaveLength(0)
    expect(cartStore.isEmpty).toBe(true)
  })
  
  it('calculates totals correctly', async () => {
    const cartStore = useCartStore()
    const userStore = useUserStore()
    
    // Set user state for tax calculation
    userStore.user = {
      address: { state: 'CA' }
    }
    
    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      stock: 10,
      weight: 1,
      // ... other product properties
    }
    
    await cartStore.addItem(product, 1)
    await cartStore.setShippingOption('standard')
    
    expect(cartStore.subtotal).toBe(100)
    expect(cartStore.taxAmount).toBe(8.75) // 8.75% CA tax
    expect(cartStore.shippingAmount).toBe(0) // Free shipping over $50
    expect(cartStore.total).toBe(108.75)
  })
  
  it('applies discount code correctly', async () => {
    const cartStore = useCartStore()
    
    // Mock successful discount code response
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
      name: 'Test Product',
      price: 100,
      stock: 10,
      // ... other product properties
    }
    
    await cartStore.addItem(product, 1)
    await cartStore.applyDiscountCode('SAVE10')
    
    expect(cartStore.appliedDiscountCode?.code).toBe('SAVE10')
    expect(cartStore.discountAmount).toBe(10)
  })
})
```

## Key Concepts

### 1. Cross-Store Communication
The cart store communicates with products and user stores to get current data and user preferences.

### 2. Async Operations
All cart operations are async to support API calls and proper error handling.

### 3. Optimistic Updates
UI updates immediately while syncing with the server in the background.

### 4. Complex Business Logic
Handles taxes, discounts, shipping calculations, and inventory validation.

### 5. State Persistence
Supports both authenticated users (server sync) and guest users (localStorage).

## Best Practices

1. **Validate data** before performing operations
2. **Handle errors gracefully** with user-friendly messages
3. **Sync state** between client and server
4. **Use optimistic updates** for better UX
5. **Implement proper loading states**
6. **Test complex business logic** thoroughly
7. **Consider offline scenarios**

## Related

- [Composing Stores](../guide/composing-stores.md)
- [Plugins](../guide/plugins.md)
- [Testing](../guide/testing.md)
- [SSR](../guide/ssr.md)