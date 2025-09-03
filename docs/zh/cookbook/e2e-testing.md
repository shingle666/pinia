---
title: 端到端测试 - Pinia 实用指南
description: 学习如何使用 Pinia store 进行端到端测试。包含 Cypress、Playwright 和测试真实用户工作流的完整指南和示例。
keywords: Pinia, Vue.js, E2E 测试, 端到端测试, Cypress, Playwright, 集成测试, 用户工作流
author: Pinia Team
generator: VitePress
og:title: 端到端测试 - Pinia 实用指南
og:description: 学习如何使用 Pinia store 进行端到端测试。包含 Cypress、Playwright 和测试真实用户工作流的完整指南和示例。
og:image: /og-image.svg
og:url: https://allfun.net/zh/cookbook/e2e-testing
twitter:card: summary_large_image
twitter:title: 端到端测试 - Pinia 实用指南
twitter:description: 学习如何使用 Pinia store 进行端到端测试。包含 Cypress、Playwright 和测试真实用户工作流的完整指南和示例。
twitter:image: /og-image.svg
---

# 端到端测试

使用 Pinia 进行端到端（E2E）测试涉及在真实浏览器环境中测试完整的用户工作流。本指南涵盖了从用户角度测试使用 Pinia store 的应用程序的策略。

## 概述

使用 Pinia 进行 E2E 测试专注于：
- 测试完整的用户工作流
- 验证跨页面重新加载的状态持久性
- 测试真实的 API 交互
- 验证跨 store 通信
- 确保在真实场景中正确处理错误

## 设置

### Cypress 设置

```bash
npm install -D cypress
```

```js
// cypress.config.js
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // 在这里实现节点事件监听器
    },
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
})
```

### Playwright 设置

```bash
npm install -D @playwright/test
```

```js
// playwright.config.js
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 测试策略

### 1. 用户认证流程

```js
// stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  
  actions: {
    async login(credentials) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        })
        
        if (!response.ok) {
          throw new Error('登录失败')
        }
        
        const data = await response.json()
        this.token = data.token
        this.user = data.user
        
        // 存储到 localStorage 以实现持久性
        localStorage.setItem('auth_token', data.token)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('auth_token')
    }
  }
})
```

#### Cypress 测试

```js
// cypress/e2e/auth.cy.js
describe('认证流程', () => {
  beforeEach(() => {
    // 每个测试前清除 localStorage
    cy.clearLocalStorage()
    cy.visit('/')
  })

  it('应该成功登录', () => {
    // 模拟 API 响应
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: { id: 1, name: '张三', email: 'zhangsan@example.com' }
      }
    }).as('loginRequest')

    // 导航到登录页面
    cy.get('[data-testid="login-button"]').click()
    
    // 填写登录表单
    cy.get('[data-testid="email-input"]').type('zhangsan@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="submit-button"]').click()
    
    // 等待 API 调用
    cy.wait('@loginRequest')
    
    // 验证成功登录
    cy.get('[data-testid="user-name"]').should('contain', '张三')
    cy.get('[data-testid="logout-button"]').should('be.visible')
    
    // 验证 token 已存储
    cy.window().its('localStorage').invoke('getItem', 'auth_token')
      .should('equal', 'mock-jwt-token')
  })

  it('应该处理登录错误', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 401,
      body: { message: '凭据无效' }
    }).as('loginError')

    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="email-input"]').type('wrong@example.com')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="submit-button"]').click()
    
    cy.wait('@loginError')
    
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', '登录失败')
  })

  it('应该在页面重新加载后保持认证状态', () => {
    // 设置已认证状态
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    // 重新加载页面
    cy.reload()
    
    // 验证用户仍然已认证
    cy.get('[data-testid="user-name"]').should('be.visible')
    cy.get('[data-testid="logout-button"]').should('be.visible')
  })

  it('应该成功退出登录', () => {
    // 设置已认证状态
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    cy.reload()
    
    // 退出登录
    cy.get('[data-testid="logout-button"]').click()
    
    // 验证退出登录
    cy.get('[data-testid="login-button"]').should('be.visible')
    cy.window().its('localStorage').invoke('getItem', 'auth_token')
      .should('be.null')
  })
})
```

#### Playwright 测试

```js
// tests/e2e/auth.spec.js
import { test, expect } from '@playwright/test'

test.describe('认证流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应该成功登录', async ({ page }) => {
    // 模拟 API 响应
    await page.route('/api/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: { id: 1, name: '张三', email: 'zhangsan@example.com' }
        })
      })
    })

    // 导航到登录页面
    await page.getByTestId('login-button').click()
    
    // 填写登录表单
    await page.getByTestId('email-input').fill('zhangsan@example.com')
    await page.getByTestId('password-input').fill('password123')
    await page.getByTestId('submit-button').click()
    
    // 验证成功登录
    await expect(page.getByTestId('user-name')).toContainText('张三')
    await expect(page.getByTestId('logout-button')).toBeVisible()
    
    // 验证 token 已存储
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBe('mock-jwt-token')
  })

  test('应该处理登录错误', async ({ page }) => {
    await page.route('/api/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: '凭据无效' })
      })
    })

    await page.getByTestId('login-button').click()
    await page.getByTestId('email-input').fill('wrong@example.com')
    await page.getByTestId('password-input').fill('wrongpassword')
    await page.getByTestId('submit-button').click()
    
    await expect(page.getByTestId('error-message')).toBeVisible()
    await expect(page.getByTestId('error-message')).toContainText('登录失败')
  })

  test('应该在页面重新加载后保持认证状态', async ({ page }) => {
    // 设置已认证状态
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    // 重新加载页面
    await page.reload()
    
    // 验证用户仍然已认证
    await expect(page.getByTestId('user-name')).toBeVisible()
    await expect(page.getByTestId('logout-button')).toBeVisible()
  })
})
```

### 2. 购物车工作流

```js
// stores/cart.js
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    isLoading: false,
    error: null
  }),
  
  getters: {
    itemCount: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    total: (state) => state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  },
  
  actions: {
    async addItem(product, quantity = 1) {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated) {
        throw new Error('必须登录才能添加商品')
      }
      
      this.isLoading = true
      
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`
          },
          body: JSON.stringify({ productId: product.id, quantity })
        })
        
        if (!response.ok) {
          throw new Error('添加商品到购物车失败')
        }
        
        const existingItem = this.items.find(item => item.id === product.id)
        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          this.items.push({ ...product, quantity })
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async checkout() {
      const authStore = useAuthStore()
      
      this.isLoading = true
      
      try {
        const response = await fetch('/api/cart/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`
          },
          body: JSON.stringify({ items: this.items })
        })
        
        if (!response.ok) {
          throw new Error('结账失败')
        }
        
        const result = await response.json()
        this.items = [] // 成功结账后清空购物车
        return result
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})
```

#### Cypress 测试

```js
// cypress/e2e/shopping-cart.cy.js
describe('购物车工作流', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    
    // 设置已认证用户
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    // 模拟产品 API
    cy.intercept('GET', '/api/products', {
      statusCode: 200,
      body: [
        { id: 1, name: '产品 1', price: 10.99 },
        { id: 2, name: '产品 2', price: 15.99 }
      ]
    }).as('getProducts')
    
    cy.visit('/')
  })

  it('应该添加商品到购物车并结账', () => {
    // 模拟购物车 API 调用
    cy.intercept('POST', '/api/cart/add', {
      statusCode: 200,
      body: { success: true }
    }).as('addToCart')
    
    cy.intercept('POST', '/api/cart/checkout', {
      statusCode: 200,
      body: { orderId: '12345', total: 26.98 }
    }).as('checkout')
    
    // 导航到产品页面
    cy.get('[data-testid="products-link"]').click()
    cy.wait('@getProducts')
    
    // 添加第一个产品到购物车
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    cy.wait('@addToCart')
    
    // 验证购物车数量更新
    cy.get('[data-testid="cart-count"]').should('contain', '1')
    
    // 添加第二个产品到购物车
    cy.get('[data-testid="product-2"] [data-testid="add-to-cart"]').click()
    cy.wait('@addToCart')
    
    // 验证购物车数量更新
    cy.get('[data-testid="cart-count"]').should('contain', '2')
    
    // 前往购物车
    cy.get('[data-testid="cart-link"]').click()
    
    // 验证购物车内容
    cy.get('[data-testid="cart-item-1"]').should('contain', '产品 1')
    cy.get('[data-testid="cart-item-2"]').should('contain', '产品 2')
    cy.get('[data-testid="cart-total"]').should('contain', '¥26.98')
    
    // 进行结账
    cy.get('[data-testid="checkout-button"]').click()
    cy.wait('@checkout')
    
    // 验证成功结账
    cy.get('[data-testid="order-confirmation"]')
      .should('be.visible')
      .and('contain', '订单 #12345')
    
    // 验证购物车为空
    cy.get('[data-testid="cart-count"]').should('contain', '0')
  })

  it('应该处理添加到购物车的错误', () => {
    cy.intercept('POST', '/api/cart/add', {
      statusCode: 500,
      body: { message: '服务器错误' }
    }).as('addToCartError')
    
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    cy.wait('@addToCartError')
    
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', '添加商品到购物车失败')
  })

  it('购物车操作应该需要认证', () => {
    // 清除认证
    cy.clearLocalStorage()
    cy.reload()
    
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    
    // 应该重定向到登录或显示错误
    cy.get('[data-testid="login-required-message"]')
      .should('be.visible')
      .and('contain', '必须登录')
  })
})
```

### 3. 跨 Store 通信

```js
// cypress/e2e/cross-store-communication.cy.js
describe('跨 Store 通信', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  it('应该更新用户偏好并在购物车中反映', () => {
    // 模拟 API
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: { id: 1, name: '张三', currency: 'CNY' }
      }
    }).as('login')
    
    cy.intercept('PUT', '/api/user/preferences', {
      statusCode: 200,
      body: { success: true }
    }).as('updatePreferences')
    
    // 登录
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="email-input"]').type('zhangsan@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="submit-button"]').click()
    cy.wait('@login')
    
    // 添加商品到购物车（应该显示人民币价格）
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="price"]')
      .should('contain', '¥10.99')
    
    // 更改货币偏好
    cy.get('[data-testid="user-menu"]').click()
    cy.get('[data-testid="preferences-link"]').click()
    cy.get('[data-testid="currency-select"]').select('USD')
    cy.get('[data-testid="save-preferences"]').click()
    cy.wait('@updatePreferences')
    
    // 验证购物车中价格已更新
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="price"]')
      .should('contain', '$9.99')
  })
})
```

## 高级测试模式

### 测试状态持久性

```js
// cypress/e2e/state-persistence.cy.js
describe('状态持久性', () => {
  it('应该在浏览器会话间保持购物车', () => {
    // 设置已认证用户
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    cy.visit('/')
    
    // 添加商品到购物车
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    
    // 验证购物车有商品
    cy.get('[data-testid="cart-count"]').should('contain', '1')
    
    // 通过清除除 localStorage 外的所有内容来模拟浏览器重启
    cy.reload()
    
    // 验证购物车状态已恢复
    cy.get('[data-testid="cart-count"]').should('contain', '1')
    cy.get('[data-testid="cart-link"]').click()
    cy.get('[data-testid="cart-item-1"]').should('be.visible')
  })
})
```

### 测试实时更新

```js
// cypress/e2e/realtime-updates.cy.js
describe('实时更新', () => {
  it('应该实时更新库存', () => {
    cy.visit('/')
    
    // 模拟 WebSocket 连接
    cy.window().then((win) => {
      // 模拟 WebSocket 消息
      win.dispatchEvent(new CustomEvent('inventory-update', {
        detail: { productId: 1, stock: 5 }
      }))
    })
    
    // 验证库存已更新
    cy.get('[data-testid="product-1"] [data-testid="stock"]')
      .should('contain', '库存 5 件')
  })
})
```

### 性能测试

```js
// cypress/e2e/performance.cy.js
describe('性能', () => {
  it('应该高效处理大型数据集', () => {
    // 模拟大型数据集
    const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `产品 ${i + 1}`,
      price: Math.random() * 100
    }))
    
    cy.intercept('GET', '/api/products', {
      statusCode: 200,
      body: largeProductList
    }).as('getLargeProductList')
    
    cy.visit('/')
    cy.get('[data-testid="products-link"]').click()
    cy.wait('@getLargeProductList')
    
    // 验证页面在合理时间内加载
    cy.get('[data-testid="product-list"]', { timeout: 5000 })
      .should('be.visible')
    
    // 测试搜索性能
    cy.get('[data-testid="search-input"]').type('产品 500')
    cy.get('[data-testid="product-500"]', { timeout: 2000 })
      .should('be.visible')
  })
})
```

## 最佳实践

### 1. 使用数据测试 ID

始终使用 `data-testid` 属性进行可靠的元素选择：

```vue
<template>
  <button data-testid="add-to-cart" @click="addToCart">
    添加到购物车
  </button>
</template>
```

### 2. 模拟外部依赖

模拟 API 调用以确保一致的测试结果：

```js
// Cypress
cy.intercept('GET', '/api/products', { fixture: 'products.json' })

// Playwright
await page.route('/api/products', route => {
  route.fulfill({ path: 'fixtures/products.json' })
})
```

### 3. 测试用户旅程

专注于完整的用户工作流而不是孤立的功能：

```js
it('应该完成购买旅程', () => {
  // 1. 浏览产品
  // 2. 添加到购物车
  // 3. 登录
  // 4. 结账
  // 5. 验证订单确认
})
```

### 4. 处理异步操作

正确等待异步操作完成：

```js
// Cypress
cy.get('[data-testid="loading"]').should('not.exist')
cy.get('[data-testid="content"]').should('be.visible')

// Playwright
await expect(page.getByTestId('loading')).toBeHidden()
await expect(page.getByTestId('content')).toBeVisible()
```

### 5. 测试间清理

确保测试是隔离的：

```js
beforeEach(() => {
  cy.clearLocalStorage()
  cy.clearCookies()
  // 重置任何全局状态
})
```

## 测试工具

### 自定义命令（Cypress）

```js
// cypress/support/commands.js
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  cy.intercept('POST', '/api/login', {
    statusCode: 200,
    body: {
      token: 'mock-jwt-token',
      user: { id: 1, name: '测试用户', email }
    }
  }).as('loginRequest')
  
  cy.get('[data-testid="login-button"]').click()
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="submit-button"]').click()
  cy.wait('@loginRequest')
})

Cypress.Commands.add('addToCart', (productId) => {
  cy.intercept('POST', '/api/cart/add', {
    statusCode: 200,
    body: { success: true }
  }).as('addToCart')
  
  cy.get(`[data-testid="product-${productId}"] [data-testid="add-to-cart"]`).click()
  cy.wait('@addToCart')
})
```

### 页面对象模型（Playwright）

```js
// tests/pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page
    this.emailInput = page.getByTestId('email-input')
    this.passwordInput = page.getByTestId('password-input')
    this.submitButton = page.getByTestId('submit-button')
    this.errorMessage = page.getByTestId('error-message')
  }
  
  async login(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
  
  async expectError(message) {
    await expect(this.errorMessage).toContainText(message)
  }
}
```

## 调试 E2E 测试

### Cypress 调试

```js
it('应该调试测试', () => {
  cy.visit('/')
  cy.debug() // 暂停执行
  cy.get('[data-testid="button"]').click()
  cy.pause() // 交互式暂停
})
```

### Playwright 调试

```js
test('应该调试测试', async ({ page }) => {
  await page.goto('/')
  await page.pause() // 交互式调试
  await page.getByTestId('button').click()
})
```

## 总结

使用 Pinia 进行 E2E 测试需要一个全面的方法，涵盖：

- 完整的用户工作流
- 状态持久性和恢复
- 跨 store 通信
- 错误处理场景
- 性能考虑

通过遵循这些模式和最佳实践，你可以创建强大的 E2E 测试，让你从用户角度对应用程序的行为充满信心。

更多测试策略，请参阅：
- [组件测试](./component-testing) - 使用 Pinia 测试单个组件
- [Store 测试](../guide/testing) - 独立测试 store