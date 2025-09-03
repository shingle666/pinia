---
title: User Authentication Store Example
description: A comprehensive user authentication example demonstrating JWT token management, role-based access control, and secure authentication patterns with Pinia.
head:
  - [meta, { name: description, content: "A comprehensive user authentication example demonstrating JWT token management, role-based access control, and secure authentication patterns with Pinia." }]
  - [meta, { name: keywords, content: "Pinia authentication, JWT tokens, user management, Vue auth store" }]
---

# User Authentication Store Example

This example demonstrates a complete user authentication system using Pinia. It includes JWT token management, role-based access control, persistent sessions, and secure authentication patterns.

## Overview

The authentication example showcases:

- JWT token management and refresh
- Role-based access control (RBAC)
- Persistent authentication state
- Secure password handling
- Multi-factor authentication (MFA)
- Session management
- User profile management
- Password reset functionality
- Social authentication integration

## Features

- ✅ Login/logout functionality
- ✅ User registration
- ✅ JWT token refresh
- ✅ Role-based permissions
- ✅ Persistent sessions
- ✅ Password reset
- ✅ Multi-factor authentication
- ✅ Social login (Google, GitHub)
- ✅ User profile management
- ✅ Session timeout handling
- ✅ Security event logging

## Types Definition

```ts
// types/auth.ts
export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  roles: Role[]
  permissions: Permission[]
  emailVerified: boolean
  mfaEnabled: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  profile: UserProfile
}

export interface UserProfile {
  bio?: string
  website?: string
  location?: string
  phone?: string
  dateOfBirth?: Date
  preferences: UserPreferences
  address?: Address
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  tokenType: 'Bearer'
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
  mfaCode?: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  acceptTerms: boolean
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface MfaSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'password_change' | 'mfa_enabled' | 'suspicious_activity'
  timestamp: Date
  ipAddress: string
  userAgent: string
  location?: string
  details?: Record<string, any>
}
```

## Authentication Store

```ts
// stores/auth.ts
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { 
  User, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData, 
  PasswordResetRequest,
  PasswordReset,
  MfaSetup,
  SecurityEvent
} from '../types/auth'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  
  // State
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sessionTimeout = ref<NodeJS.Timeout | null>(null)
  const refreshTokenTimeout = ref<NodeJS.Timeout | null>(null)
  const securityEvents = ref<SecurityEvent[]>([])
  const mfaRequired = ref(false)
  const mfaSetup = ref<MfaSetup | null>(null)
  
  // Getters
  const isAuthenticated = computed(() => {
    return !!user.value && !!tokens.value && !isTokenExpired.value
  })
  
  const isTokenExpired = computed(() => {
    if (!tokens.value) return true
    return new Date() >= new Date(tokens.value.expiresAt)
  })
  
  const userRoles = computed(() => {
    return user.value?.roles.map(role => role.name) || []
  })
  
  const userPermissions = computed(() => {
    const rolePermissions = user.value?.roles.flatMap(role => role.permissions) || []
    const directPermissions = user.value?.permissions || []
    return [...rolePermissions, ...directPermissions]
  })
  
  const hasRole = computed(() => {
    return (roleName: string) => userRoles.value.includes(roleName)
  })
  
  const hasPermission = computed(() => {
    return (resource: string, action: string) => {
      return userPermissions.value.some(
        permission => permission.resource === resource && permission.action === action
      )
    }
  })
  
  const canAccess = computed(() => {
    return (requiredRoles: string[] = [], requiredPermissions: Array<{resource: string, action: string}> = []) => {
      // Check roles
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => hasRole.value(role))
        if (!hasRequiredRole) return false
      }
      
      // Check permissions
      if (requiredPermissions.length > 0) {
        const hasRequiredPermission = requiredPermissions.every(
          perm => hasPermission.value(perm.resource, perm.action)
        )
        if (!hasRequiredPermission) return false
      }
      
      return true
    }
  })
  
  // Actions
  const login = async (credentials: LoginCredentials) => {
    loading.value = true
    error.value = null
    mfaRequired.value = false
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (data.requiresMfa) {
          mfaRequired.value = true
          throw new Error('MFA code required')
        }
        throw new Error(data.message || 'Login failed')
      }
      
      // Set user and tokens
      user.value = data.user
      tokens.value = data.tokens
      
      // Store tokens securely
      if (credentials.rememberMe) {
        localStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      } else {
        sessionStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      }
      
      // Set up token refresh
      setupTokenRefresh()
      
      // Set up session timeout
      setupSessionTimeout()
      
      // Log security event
      await logSecurityEvent('login')
      
      // Redirect to intended page or dashboard
      const redirectTo = router.currentRoute.value.query.redirect as string || '/dashboard'
      router.push(redirectTo)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const register = async (data: RegisterData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed')
      }
      
      // Auto-login after successful registration
      await login({
        email: data.email,
        password: data.password
      })
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const logout = async (everywhere = false) => {
    loading.value = true
    
    try {
      if (tokens.value) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.value.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ everywhere })
        })
      }
      
      // Log security event
      await logSecurityEvent('logout')
      
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear local state
      user.value = null
      tokens.value = null
      mfaRequired.value = false
      mfaSetup.value = null
      
      // Clear stored tokens
      localStorage.removeItem('auth_tokens')
      sessionStorage.removeItem('auth_tokens')
      
      // Clear timeouts
      clearTokenRefresh()
      clearSessionTimeout()
      
      loading.value = false
      
      // Redirect to login
      router.push('/login')
    }
  }
  
  const refreshToken = async () => {
    if (!tokens.value?.refreshToken) {
      await logout()
      return false
    }
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: tokens.value.refreshToken
        })
      })
      
      if (!response.ok) {
        await logout()
        return false
      }
      
      const data = await response.json()
      tokens.value = data.tokens
      
      // Update stored tokens
      const storage = localStorage.getItem('auth_tokens') ? localStorage : sessionStorage
      storage.setItem('auth_tokens', JSON.stringify(data.tokens))
      
      // Reset token refresh timer
      setupTokenRefresh()
      
      return true
    } catch (err) {
      console.error('Token refresh failed:', err)
      await logout()
      return false
    }
  }
  
  const updateProfile = async (profileData: Partial<User>) => {
    if (!user.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens.value?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Profile update failed')
      }
      
      const updatedUser = await response.json()
      user.value = { ...user.value, ...updatedUser }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Profile update failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const changePassword = async (currentPassword: string, newPassword: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.value?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Password change failed')
      }
      
      // Log security event
      await logSecurityEvent('password_change')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password change failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const requestPasswordReset = async (data: PasswordResetRequest) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Password reset request failed')
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password reset request failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const resetPassword = async (data: PasswordReset) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Password reset failed')
      }
      
      // Redirect to login
      router.push('/login?message=password-reset-success')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password reset failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const setupMfa = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.value?.accessToken}`
        }
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'MFA setup failed')
      }
      
      mfaSetup.value = await response.json()
      return mfaSetup.value
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'MFA setup failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const enableMfa = async (code: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.value?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'MFA enable failed')
      }
      
      if (user.value) {
        user.value.mfaEnabled = true
      }
      
      mfaSetup.value = null
      
      // Log security event
      await logSecurityEvent('mfa_enabled')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'MFA enable failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const disableMfa = async (password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.value?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'MFA disable failed')
      }
      
      if (user.value) {
        user.value.mfaEnabled = false
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'MFA disable failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const socialLogin = async (provider: 'google' | 'github', code: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/auth/social/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Social login failed')
      }
      
      // Set user and tokens
      user.value = data.user
      tokens.value = data.tokens
      
      // Store tokens
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      
      // Set up token refresh and session timeout
      setupTokenRefresh()
      setupSessionTimeout()
      
      // Log security event
      await logSecurityEvent('login')
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Social login failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const loadSecurityEvents = async () => {
    if (!tokens.value) return
    
    try {
      const response = await fetch('/api/user/security-events', {
        headers: {
          'Authorization': `Bearer ${tokens.value.accessToken}`
        }
      })
      
      if (response.ok) {
        securityEvents.value = await response.json()
      }
    } catch (err) {
      console.error('Failed to load security events:', err)
    }
  }
  
  const logSecurityEvent = async (type: SecurityEvent['type'], details?: Record<string, any>) => {
    if (!tokens.value) return
    
    try {
      await fetch('/api/user/security-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.value.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          details
        })
      })
    } catch (err) {
      console.error('Failed to log security event:', err)
    }
  }
  
  const setupTokenRefresh = () => {
    clearTokenRefresh()
    
    if (!tokens.value) return
    
    const expiresAt = new Date(tokens.value.expiresAt)
    const now = new Date()
    const timeUntilRefresh = expiresAt.getTime() - now.getTime() - (5 * 60 * 1000) // Refresh 5 minutes before expiry
    
    if (timeUntilRefresh > 0) {
      refreshTokenTimeout.value = setTimeout(() => {
        refreshToken()
      }, timeUntilRefresh)
    }
  }
  
  const clearTokenRefresh = () => {
    if (refreshTokenTimeout.value) {
      clearTimeout(refreshTokenTimeout.value)
      refreshTokenTimeout.value = null
    }
  }
  
  const setupSessionTimeout = () => {
    clearSessionTimeout()
    
    // Set session timeout to 30 minutes of inactivity
    sessionTimeout.value = setTimeout(() => {
      logout()
    }, 30 * 60 * 1000)
  }
  
  const clearSessionTimeout = () => {
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
      sessionTimeout.value = null
    }
  }
  
  const resetSessionTimeout = () => {
    if (isAuthenticated.value) {
      setupSessionTimeout()
    }
  }
  
  const initializeAuth = async () => {
    // Try to load tokens from storage
    const storedTokens = localStorage.getItem('auth_tokens') || sessionStorage.getItem('auth_tokens')
    
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens)
        tokens.value = parsedTokens
        
        // Check if token is expired
        if (isTokenExpired.value) {
          const refreshed = await refreshToken()
          if (!refreshed) return
        }
        
        // Load user data
        const response = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${tokens.value?.accessToken}`
          }
        })
        
        if (response.ok) {
          user.value = await response.json()
          setupTokenRefresh()
          setupSessionTimeout()
          loadSecurityEvents()
        } else {
          await logout()
        }
      } catch (err) {
        console.error('Auth initialization failed:', err)
        await logout()
      }
    }
  }
  
  // Watch for user activity to reset session timeout
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
  
  const handleUserActivity = () => {
    resetSessionTimeout()
  }
  
  // Set up activity listeners
  if (typeof window !== 'undefined') {
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })
  }
  
  // Initialize auth on store creation
  initializeAuth()
  
  return {
    // State
    user: readonly(user),
    tokens: readonly(tokens),
    loading: readonly(loading),
    error: readonly(error),
    mfaRequired: readonly(mfaRequired),
    mfaSetup: readonly(mfaSetup),
    securityEvents: readonly(securityEvents),
    
    // Getters
    isAuthenticated,
    isTokenExpired,
    userRoles,
    userPermissions,
    hasRole,
    hasPermission,
    canAccess,
    
    // Actions
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    setupMfa,
    enableMfa,
    disableMfa,
    socialLogin,
    loadSecurityEvents,
    resetSessionTimeout
  }
})
```

## Component Usage

### Login Component

```vue
<!-- components/LoginForm.vue -->
<template>
  <form @submit.prevent="handleLogin" class="login-form">
    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="credentials.email"
        type="email"
        required
        :disabled="authStore.loading"
      />
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="credentials.password"
        type="password"
        required
        :disabled="authStore.loading"
      />
    </div>
    
    <div v-if="authStore.mfaRequired" class="form-group">
      <label for="mfaCode">MFA Code</label>
      <input
        id="mfaCode"
        v-model="credentials.mfaCode"
        type="text"
        placeholder="Enter 6-digit code"
        maxlength="6"
        required
      />
    </div>
    
    <div class="form-group">
      <label>
        <input
          v-model="credentials.rememberMe"
          type="checkbox"
        />
        Remember me
      </label>
    </div>
    
    <div v-if="authStore.error" class="error">
      {{ authStore.error }}
    </div>
    
    <button 
      type="submit" 
      :disabled="authStore.loading"
      class="login-btn"
    >
      {{ authStore.loading ? 'Logging in...' : 'Login' }}
    </button>
    
    <div class="social-login">
      <button 
        type="button" 
        @click="handleSocialLogin('google')"
        class="social-btn google"
      >
        Login with Google
      </button>
      
      <button 
        type="button" 
        @click="handleSocialLogin('github')"
        class="social-btn github"
      >
        Login with GitHub
      </button>
    </div>
    
    <div class="form-links">
      <router-link to="/register">Create account</router-link>
      <router-link to="/password-reset">Forgot password?</router-link>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import type { LoginCredentials } from '../types/auth'

const authStore = useAuthStore()

const credentials = ref<LoginCredentials>({
  email: '',
  password: '',
  rememberMe: false
})

const handleLogin = async () => {
  try {
    await authStore.login(credentials.value)
  } catch (error) {
    // Error is handled in the store
  }
}

const handleSocialLogin = async (provider: 'google' | 'github') => {
  // Redirect to OAuth provider
  window.location.href = `/api/auth/social/${provider}`
}
</script>
```

### Route Guard

```ts
// router/guards.ts
import { useAuthStore } from '../stores/auth'
import type { RouteLocationNormalized } from 'vue-router'

export const authGuard = (to: RouteLocationNormalized) => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath }
    }
  }
  
  return true
}

export const roleGuard = (requiredRoles: string[]) => {
  return (to: RouteLocationNormalized) => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    
    if (!authStore.canAccess(requiredRoles)) {
      return { name: 'forbidden' }
    }
    
    return true
  }
}

export const permissionGuard = (requiredPermissions: Array<{resource: string, action: string}>) => {
  return (to: RouteLocationNormalized) => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    
    if (!authStore.canAccess([], requiredPermissions)) {
      return { name: 'forbidden' }
    }
    
    return true
  }
}
```

## Testing

```ts
// tests/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'

// Mock fetch and router
global.fetch = vi.fn()
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, currentRoute: { value: { query: {} } } })
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })
  
  it('logs in successfully', async () => {
    const authStore = useAuthStore()
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      roles: [{ name: 'user', permissions: [] }]
    }
    
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, tokens: mockTokens })
    } as Response)
    
    await authStore.login({
      email: 'test@example.com',
      password: 'password'
    })
    
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user?.email).toBe('test@example.com')
    expect(authStore.userRoles).toContain('user')
  })
  
  it('handles login failure', async () => {
    const authStore = useAuthStore()
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' })
    } as Response)
    
    await expect(authStore.login({
      email: 'test@example.com',
      password: 'wrong-password'
    })).rejects.toThrow('Invalid credentials')
    
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.error).toBe('Invalid credentials')
  })
  
  it('checks user permissions correctly', async () => {
    const authStore = useAuthStore()
    
    authStore.user = {
      id: '1',
      email: 'test@example.com',
      roles: [{
        name: 'admin',
        permissions: [{
          resource: 'users',
          action: 'read'
        }]
      }],
      permissions: []
    }
    
    expect(authStore.hasRole('admin')).toBe(true)
    expect(authStore.hasRole('user')).toBe(false)
    expect(authStore.hasPermission('users', 'read')).toBe(true)
    expect(authStore.hasPermission('users', 'write')).toBe(false)
  })
  
  it('refreshes token automatically', async () => {
    const authStore = useAuthStore()
    
    const expiredTokens = {
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() - 1000) // Expired
    }
    
    const newTokens = {
      accessToken: 'new-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 3600000)
    }
    
    authStore.tokens = expiredTokens
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ tokens: newTokens })
    } as Response)
    
    const result = await authStore.refreshToken()
    
    expect(result).toBe(true)
    expect(authStore.tokens?.accessToken).toBe('new-token')
  })
})
```

## Key Concepts

### 1. JWT Token Management
Automatic token refresh and secure storage of authentication tokens.

### 2. Role-Based Access Control
Flexible permission system supporting both roles and granular permissions.

### 3. Session Management
Automatic session timeout and activity tracking for security.

### 4. Multi-Factor Authentication
Support for TOTP-based MFA with setup and management.

### 5. Social Authentication
Integration with OAuth providers like Google and GitHub.

## Security Best Practices

1. **Secure token storage** - Use httpOnly cookies in production
2. **Token rotation** - Implement automatic token refresh
3. **Session timeout** - Automatic logout after inactivity
4. **MFA support** - Optional two-factor authentication
5. **Activity logging** - Track security-related events
6. **Input validation** - Validate all user inputs
7. **HTTPS only** - Never transmit credentials over HTTP

## Related

- [Route Guards](../guide/routing.md)
- [Testing](../guide/testing.md)
- [Plugins](../guide/plugins.md)
- [SSR](../guide/ssr.md)