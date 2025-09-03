---
title: End-to-End Testing - Pinia Cookbook
description: Learn how to perform end-to-end testing with Pinia stores. Complete guide with examples for Cypress, Playwright, and testing real user workflows.
keywords: Pinia, Vue.js, E2E testing, end-to-end testing, Cypress, Playwright, integration testing, user workflows
author: Pinia Team
generator: VitePress
og:title: End-to-End Testing - Pinia Cookbook
og:description: Learn how to perform end-to-end testing with Pinia stores. Complete guide with examples for Cypress, Playwright, and testing real user workflows.
og:image: /og-image.svg
og:url: https://allfun.net/cookbook/e2e-testing
twitter:card: summary_large_image
twitter:title: End-to-End Testing - Pinia Cookbook
twitter:description: Learn how to perform end-to-end testing with Pinia stores. Complete guide with examples for Cypress, Playwright, and testing real user workflows.
twitter:image: /og-image.svg
---

# End-to-End Testing

End-to-end (E2E) testing with Pinia involves testing complete user workflows in a real browser environment. This guide covers strategies for testing applications that use Pinia stores from a user's perspective.

## Overview

E2E testing with Pinia focuses on:
- Testing complete user workflows
- Verifying state persistence across page reloads
- Testing real API interactions
- Validating cross-store communication
- Ensuring proper error handling in real scenarios

## Setup

### Cypress Setup

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
      // implement node event listeners here
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

### Playwright Setup

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

## Testing Strategies

### 1. User Authentication Flow

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
          throw new Error('Login failed')
        }
        
        const data = await response.json()
        this.token = data.token
        this.user = data.user
        
        // Store in localStorage for persistence
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

#### Cypress Test

```js
// cypress/e2e/auth.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    cy.visit('/')
  })

  it('should login successfully', () => {
    // Mock the API response
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: { id: 1, name: 'John Doe', email: 'john@example.com' }
      }
    }).as('loginRequest')

    // Navigate to login page
    cy.get('[data-testid="login-button"]').click()
    
    // Fill login form
    cy.get('[data-testid="email-input"]').type('john@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="submit-button"]').click()
    
    // Wait for API call
    cy.wait('@loginRequest')
    
    // Verify successful login
    cy.get('[data-testid="user-name"]').should('contain', 'John Doe')
    cy.get('[data-testid="logout-button"]').should('be.visible')
    
    // Verify token is stored
    cy.window().its('localStorage').invoke('getItem', 'auth_token')
      .should('equal', 'mock-jwt-token')
  })

  it('should handle login errors', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('loginError')

    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="email-input"]').type('wrong@example.com')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="submit-button"]').click()
    
    cy.wait('@loginError')
    
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Login failed')
  })

  it('should persist authentication across page reloads', () => {
    // Set up authenticated state
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    // Reload page
    cy.reload()
    
    // Verify user is still authenticated
    cy.get('[data-testid="user-name"]').should('be.visible')
    cy.get('[data-testid="logout-button"]').should('be.visible')
  })

  it('should logout successfully', () => {
    // Set up authenticated state
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    cy.reload()
    
    // Logout
    cy.get('[data-testid="logout-button"]').click()
    
    // Verify logout
    cy.get('[data-testid="login-button"]').should('be.visible')
    cy.window().its('localStorage').invoke('getItem', 'auth_token')
      .should('be.null')
  })
})
```

#### Playwright Test

```js
// tests/e2e/auth.spec.js
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should login successfully', async ({ page }) => {
    // Mock the API response
    await page.route('/api/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: { id: 1, name: 'John Doe', email: 'john@example.com' }
        })
      })
    })

    // Navigate to login page
    await page.getByTestId('login-button').click()
    
    // Fill login form
    await page.getByTestId('email-input').fill('john@example.com')
    await page.getByTestId('password-input').fill('password123')
    await page.getByTestId('submit-button').click()
    
    // Verify successful login
    await expect(page.getByTestId('user-name')).toContainText('John Doe')
    await expect(page.getByTestId('logout-button')).toBeVisible()
    
    // Verify token is stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBe('mock-jwt-token')
  })

  test('should handle login errors', async ({ page }) => {
    await page.route('/api/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' })
      })
    })

    await page.getByTestId('login-button').click()
    await page.getByTestId('email-input').fill('wrong@example.com')
    await page.getByTestId('password-input').fill('wrongpassword')
    await page.getByTestId('submit-button').click()
    
    await expect(page.getByTestId('error-message')).toBeVisible()
    await expect(page.getByTestId('error-message')).toContainText('Login failed')
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    // Set up authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    // Reload page
    await page.reload()
    
    // Verify user is still authenticated
    await expect(page.getByTestId('user-name')).toBeVisible()
    await expect(page.getByTestId('logout-button')).toBeVisible()
  })
})
```

### 2. Shopping Cart Workflow

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
        throw new Error('Must be logged in to add items')
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
          throw new Error('Failed to add item to cart')
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
          throw new Error('Checkout failed')
        }
        
        const result = await response.json()
        this.items = [] // Clear cart after successful checkout
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

#### Cypress Test

```js
// cypress/e2e/shopping-cart.cy.js
describe('Shopping Cart Workflow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    
    // Set up authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    // Mock product API
    cy.intercept('GET', '/api/products', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Product 1', price: 10.99 },
        { id: 2, name: 'Product 2', price: 15.99 }
      ]
    }).as('getProducts')
    
    cy.visit('/')
  })

  it('should add items to cart and checkout', () => {
    // Mock cart API calls
    cy.intercept('POST', '/api/cart/add', {
      statusCode: 200,
      body: { success: true }
    }).as('addToCart')
    
    cy.intercept('POST', '/api/cart/checkout', {
      statusCode: 200,
      body: { orderId: '12345', total: 26.98 }
    }).as('checkout')
    
    // Navigate to products page
    cy.get('[data-testid="products-link"]').click()
    cy.wait('@getProducts')
    
    // Add first product to cart
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    cy.wait('@addToCart')
    
    // Verify cart count updated
    cy.get('[data-testid="cart-count"]').should('contain', '1')
    
    // Add second product to cart
    cy.get('[data-testid="product-2"] [data-testid="add-to-cart"]').click()
    cy.wait('@addToCart')
    
    // Verify cart count updated
    cy.get('[data-testid="cart-count"]').should('contain', '2')
    
    // Go to cart
    cy.get('[data-testid="cart-link"]').click()
    
    // Verify cart contents
    cy.get('[data-testid="cart-item-1"]').should('contain', 'Product 1')
    cy.get('[data-testid="cart-item-2"]').should('contain', 'Product 2')
    cy.get('[data-testid="cart-total"]').should('contain', '$26.98')
    
    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click()
    cy.wait('@checkout')
    
    // Verify successful checkout
    cy.get('[data-testid="order-confirmation"]')
      .should('be.visible')
      .and('contain', 'Order #12345')
    
    // Verify cart is empty
    cy.get('[data-testid="cart-count"]').should('contain', '0')
  })

  it('should handle add to cart errors', () => {
    cy.intercept('POST', '/api/cart/add', {
      statusCode: 500,
      body: { message: 'Server error' }
    }).as('addToCartError')
    
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    cy.wait('@addToCartError')
    
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Failed to add item to cart')
  })

  it('should require authentication for cart operations', () => {
    // Clear authentication
    cy.clearLocalStorage()
    cy.reload()
    
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    
    // Should redirect to login or show error
    cy.get('[data-testid="login-required-message"]')
      .should('be.visible')
      .and('contain', 'Must be logged in')
  })
})
```

### 3. Cross-Store Communication

```js
// cypress/e2e/cross-store-communication.cy.js
describe('Cross-Store Communication', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  it('should update user preferences and reflect in cart', () => {
    // Mock APIs
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: { id: 1, name: 'John Doe', currency: 'USD' }
      }
    }).as('login')
    
    cy.intercept('PUT', '/api/user/preferences', {
      statusCode: 200,
      body: { success: true }
    }).as('updatePreferences')
    
    // Login
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="email-input"]').type('john@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="submit-button"]').click()
    cy.wait('@login')
    
    // Add item to cart (should show USD prices)
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="price"]')
      .should('contain', '$10.99')
    
    // Change currency preference
    cy.get('[data-testid="user-menu"]').click()
    cy.get('[data-testid="preferences-link"]').click()
    cy.get('[data-testid="currency-select"]').select('EUR')
    cy.get('[data-testid="save-preferences"]').click()
    cy.wait('@updatePreferences')
    
    // Verify prices updated in cart
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="price"]')
      .should('contain', '€9.99')
  })
})
```

## Advanced Testing Patterns

### Testing State Persistence

```js
// cypress/e2e/state-persistence.cy.js
describe('State Persistence', () => {
  it('should persist cart across browser sessions', () => {
    // Set up authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token')
    })
    
    cy.visit('/')
    
    // Add items to cart
    cy.get('[data-testid="products-link"]').click()
    cy.get('[data-testid="product-1"] [data-testid="add-to-cart"]').click()
    
    // Verify cart has items
    cy.get('[data-testid="cart-count"]').should('contain', '1')
    
    // Simulate browser restart by clearing everything except localStorage
    cy.reload()
    
    // Verify cart state is restored
    cy.get('[data-testid="cart-count"]').should('contain', '1')
    cy.get('[data-testid="cart-link"]').click()
    cy.get('[data-testid="cart-item-1"]').should('be.visible')
  })
})
```

### Testing Real-time Updates

```js
// cypress/e2e/realtime-updates.cy.js
describe('Real-time Updates', () => {
  it('should update inventory in real-time', () => {
    cy.visit('/')
    
    // Mock WebSocket connection
    cy.window().then((win) => {
      // Simulate WebSocket message
      win.dispatchEvent(new CustomEvent('inventory-update', {
        detail: { productId: 1, stock: 5 }
      }))
    })
    
    // Verify inventory updated
    cy.get('[data-testid="product-1"] [data-testid="stock"]')
      .should('contain', '5 in stock')
  })
})
```

### Performance Testing

```js
// cypress/e2e/performance.cy.js
describe('Performance', () => {
  it('should handle large datasets efficiently', () => {
    // Mock large dataset
    const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      price: Math.random() * 100
    }))
    
    cy.intercept('GET', '/api/products', {
      statusCode: 200,
      body: largeProductList
    }).as('getLargeProductList')
    
    cy.visit('/')
    cy.get('[data-testid="products-link"]').click()
    cy.wait('@getLargeProductList')
    
    // Verify page loads within reasonable time
    cy.get('[data-testid="product-list"]', { timeout: 5000 })
      .should('be.visible')
    
    // Test search performance
    cy.get('[data-testid="search-input"]').type('Product 500')
    cy.get('[data-testid="product-500"]', { timeout: 2000 })
      .should('be.visible')
  })
})
```

## Best Practices

### 1. Use Data Test IDs

Always use `data-testid` attributes for reliable element selection:

```vue
<template>
  <button data-testid="add-to-cart" @click="addToCart">
    Add to Cart
  </button>
</template>
```

### 2. Mock External Dependencies

Mock API calls to ensure consistent test results:

```js
// Cypress
cy.intercept('GET', '/api/products', { fixture: 'products.json' })

// Playwright
await page.route('/api/products', route => {
  route.fulfill({ path: 'fixtures/products.json' })
})
```

### 3. Test User Journeys

Focus on complete user workflows rather than isolated features:

```js
it('should complete purchase journey', () => {
  // 1. Browse products
  // 2. Add to cart
  // 3. Login
  // 4. Checkout
  // 5. Verify order confirmation
})
```

### 4. Handle Async Operations

Properly wait for async operations to complete:

```js
// Cypress
cy.get('[data-testid="loading"]').should('not.exist')
cy.get('[data-testid="content"]').should('be.visible')

// Playwright
await expect(page.getByTestId('loading')).toBeHidden()
await expect(page.getByTestId('content')).toBeVisible()
```

### 5. Clean Up Between Tests

Ensure tests are isolated:

```js
beforeEach(() => {
  cy.clearLocalStorage()
  cy.clearCookies()
  // Reset any global state
})
```

## Testing Utilities

### Custom Commands (Cypress)

```js
// cypress/support/commands.js
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  cy.intercept('POST', '/api/login', {
    statusCode: 200,
    body: {
      token: 'mock-jwt-token',
      user: { id: 1, name: 'Test User', email }
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

### Page Object Model (Playwright)

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

## Debugging E2E Tests

### Cypress Debugging

```js
it('should debug test', () => {
  cy.visit('/')
  cy.debug() // Pause execution
  cy.get('[data-testid="button"]').click()
  cy.pause() // Interactive pause
})
```

### Playwright Debugging

```js
test('should debug test', async ({ page }) => {
  await page.goto('/')
  await page.pause() // Interactive debugging
  await page.getByTestId('button').click()
})
```

## Conclusion

E2E testing with Pinia requires a comprehensive approach that covers:

- Complete user workflows
- State persistence and restoration
- Cross-store communication
- Error handling scenarios
- Performance considerations

By following these patterns and best practices, you can create robust E2E tests that give you confidence in your application's behavior from a user's perspective.

For more testing strategies, see:
- [Component Testing](./component-testing) - Testing individual components with Pinia
- [Store Testing](../guide/testing) - Testing stores in isolation