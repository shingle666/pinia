---
title: 用户认证 Store 示例
description: 一个全面的用户认证示例，展示了 JWT 令牌管理、基于角色的访问控制和使用 Pinia 的安全认证模式。
head:
  - [meta, { name: description, content: "一个全面的用户认证示例，展示了 JWT 令牌管理、基于角色的访问控制和使用 Pinia 的安全认证模式。" }]
  - [meta, { name: keywords, content: "Pinia 认证, JWT 令牌, 用户管理, Vue 认证 Store" }]
---

# 用户认证 Store 示例

这个示例展示了使用 Pinia 的完整用户认证系统。它包括 JWT 令牌管理、基于角色的访问控制、持久会话和安全认证模式。

## 概述

认证示例展示了：

- JWT 令牌管理和刷新
- 基于角色的访问控制 (RBAC)
- 持久认证状态
- 安全密码处理
- 多因素认证 (MFA)
- 会话管理
- 用户资料管理
- 密码重置功能
- 社交认证集成

## 功能特性

- ✅ 登录/登出功能
- ✅ 用户注册
- ✅ JWT 令牌刷新
- ✅ 基于角色的权限
- ✅ 持久会话
- ✅ 密码重置
- ✅ 多因素认证
- ✅ 社交登录（Google、GitHub）
- ✅ 用户资料管理
- ✅ 会话超时处理
- ✅ 安全事件记录

## 类型定义

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

## 认证 Store

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
  
  // 状态
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sessionTimeout = ref<NodeJS.Timeout | null>(null)
  const refreshTokenTimeout = ref<NodeJS.Timeout | null>(null)
  const securityEvents = ref<SecurityEvent[]>([])
  const mfaRequired = ref(false)
  const mfaSetup = ref<MfaSetup | null>(null)
  
  // 计算属性
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
      // 检查角色
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => hasRole.value(role))
        if (!hasRequiredRole) return false
      }
      
      // 检查权限
      if (requiredPermissions.length > 0) {
        const hasRequiredPermission = requiredPermissions.every(
          perm => hasPermission.value(perm.resource, perm.action)
        )
        if (!hasRequiredPermission) return false
      }
      
      return true
    }
  })
  
  // 操作方法
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
          throw new Error('需要 MFA 验证码')
        }
        throw new Error(data.message || '登录失败')
      }
      
      // 设置用户和令牌
      user.value = data.user
      tokens.value = data.tokens
      
      // 安全存储令牌
      if (credentials.rememberMe) {
        localStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      } else {
        sessionStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      }
      
      // 设置令牌刷新
      setupTokenRefresh()
      
      // 设置会话超时
      setupSessionTimeout()
      
      // 记录安全事件
      await logSecurityEvent('login')
      
      // 重定向到目标页面或仪表板
      const redirectTo = router.currentRoute.value.query.redirect as string || '/dashboard'
      router.push(redirectTo)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
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
        throw new Error(result.message || '注册失败')
      }
      
      // 注册成功后自动登录
      await login({
        email: data.email,
        password: data.password
      })
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败'
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
      
      // 记录安全事件
      await logSecurityEvent('logout')
      
    } catch (err) {
      console.error('登出错误:', err)
    } finally {
      // 清除本地状态
      user.value = null
      tokens.value = null
      mfaRequired.value = false
      mfaSetup.value = null
      
      // 清除存储的令牌
      localStorage.removeItem('auth_tokens')
      sessionStorage.removeItem('auth_tokens')
      
      // 清除定时器
      clearTokenRefresh()
      clearSessionTimeout()
      
      loading.value = false
      
      // 重定向到登录页
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
      
      // 更新存储的令牌
      const storage = localStorage.getItem('auth_tokens') ? localStorage : sessionStorage
      storage.setItem('auth_tokens', JSON.stringify(data.tokens))
      
      // 重置令牌刷新定时器
      setupTokenRefresh()
      
      return true
    } catch (err) {
      console.error('令牌刷新失败:', err)
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
        throw new Error(data.message || '资料更新失败')
      }
      
      const updatedUser = await response.json()
      user.value = { ...user.value, ...updatedUser }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '资料更新失败'
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
        throw new Error(data.message || '密码修改失败')
      }
      
      // 记录安全事件
      await logSecurityEvent('password_change')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '密码修改失败'
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
        throw new Error(result.message || '密码重置请求失败')
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '密码重置请求失败'
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
        throw new Error(result.message || '密码重置失败')
      }
      
      // 重定向到登录页
      router.push('/login?message=password-reset-success')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '密码重置失败'
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
        throw new Error(data.message || 'MFA 设置失败')
      }
      
      mfaSetup.value = await response.json()
      return mfaSetup.value
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'MFA 设置失败'
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
        throw new Error(data.message || 'MFA 启用失败')
      }
      
      if (user.value) {
        user.value.mfaEnabled = true
      }
      
      mfaSetup.value = null
      
      // 记录安全事件
      await logSecurityEvent('mfa_enabled')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'MFA 启用失败'
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
        throw new Error(data.message || 'MFA 禁用失败')
      }
      
      if (user.value) {
        user.value.mfaEnabled = false
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'MFA 禁用失败'
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
        throw new Error(data.message || '社交登录失败')
      }
      
      // 设置用户和令牌
      user.value = data.user
      tokens.value = data.tokens
      
      // 存储令牌
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      
      // 设置令牌刷新和会话超时
      setupTokenRefresh()
      setupSessionTimeout()
      
      // 记录安全事件
      await logSecurityEvent('login')
      
      // 重定向到仪表板
      router.push('/dashboard')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '社交登录失败'
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
      console.error('加载安全事件失败:', err)
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
      console.error('记录安全事件失败:', err)
    }
  }
  
  const setupTokenRefresh = () => {
    clearTokenRefresh()
    
    if (!tokens.value) return
    
    const expiresAt = new Date(tokens.value.expiresAt)
    const now = new Date()
    const timeUntilRefresh = expiresAt.getTime() - now.getTime() - (5 * 60 * 1000) // 提前 5 分钟刷新
    
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
    
    // 设置 30 分钟无活动会话超时
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
    // 尝试从存储中加载令牌
    const storedTokens = localStorage.getItem('auth_tokens') || sessionStorage.getItem('auth_tokens')
    
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens)
        tokens.value = parsedTokens
        
        // 检查令牌是否过期
        if (isTokenExpired.value) {
          const refreshed = await refreshToken()
          if (!refreshed) return
        }
        
        // 加载用户数据
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
        console.error('认证初始化失败:', err)
        await logout()
      }
    }
  }
  
  // 监听用户活动以重置会话超时
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
  
  const handleUserActivity = () => {
    resetSessionTimeout()
  }
  
  // 设置活动监听器
  if (typeof window !== 'undefined') {
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })
  }
  
  // 在 Store 创建时初始化认证
  initializeAuth()
  
  return {
    // 状态
    user: readonly(user),
    tokens: readonly(tokens),
    loading: readonly(loading),
    error: readonly(error),
    mfaRequired: readonly(mfaRequired),
    mfaSetup: readonly(mfaSetup),
    securityEvents: readonly(securityEvents),
    
    // 计算属性
    isAuthenticated,
    isTokenExpired,
    userRoles,
    userPermissions,
    hasRole,
    hasPermission,
    canAccess,
    
    // 操作方法
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

## 组件使用

### 登录组件

```vue
<!-- components/LoginForm.vue -->
<template>
  <form @submit.prevent="handleLogin" class="login-form">
    <div class="form-group">
      <label for="email">邮箱</label>
      <input
        id="email"
        v-model="credentials.email"
        type="email"
        required
        :disabled="authStore.loading"
      />
    </div>
    
    <div class="form-group">
      <label for="password">密码</label>
      <input
        id="password"
        v-model="credentials.password"
        type="password"
        required
        :disabled="authStore.loading"
      />
    </div>
    
    <div v-if="authStore.mfaRequired" class="form-group">
      <label for="mfaCode">MFA 验证码</label>
      <input
        id="mfaCode"
        v-model="credentials.mfaCode"
        type="text"
        placeholder="输入 6 位验证码"
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
        记住我
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
      {{ authStore.loading ? '登录中...' : '登录' }}
    </button>
    
    <div class="social-login">
      <button 
        type="button" 
        @click="handleSocialLogin('google')"
        class="social-btn google"
      >
        使用 Google 登录
      </button>
      
      <button 
        type="button" 
        @click="handleSocialLogin('github')"
        class="social-btn github"
      >
        使用 GitHub 登录
      </button>
    </div>
    
    <div class="form-links">
      <router-link to="/register">创建账户</router-link>
      <router-link to="/password-reset">忘记密码？</router-link>
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
    // 错误在 Store 中处理
  }
}

const handleSocialLogin = async (provider: 'google' | 'github') => {
  // 重定向到 OAuth 提供商
  window.location.href = `/api/auth/social/${provider}`
}
</script>
```

### 路由守卫

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

## 测试

```ts
// tests/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'

// 模拟 fetch 和 router
global.fetch = vi.fn()
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, currentRoute: { value: { query: {} } } })
}))

describe('认证 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })
  
  it('成功登录', async () => {
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
      expiresAt: new Date(Date.now() + 3600000) // 1 小时后
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
  
  it('处理登录失败', async () => {
    const authStore = useAuthStore()
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: '无效凭据' })
    } as Response)
    
    await expect(authStore.login({
      email: 'test@example.com',
      password: 'wrong-password'
    })).rejects.toThrow('无效凭据')
    
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.error).toBe('无效凭据')
  })
  
  it('正确检查用户权限', async () => {
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
  
  it('自动刷新令牌', async () => {
    const authStore = useAuthStore()
    
    const expiredTokens = {
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() - 1000) // 已过期
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

## 核心概念

### 1. JWT 令牌管理
自动令牌刷新和认证令牌的安全存储。

### 2. 基于角色的访问控制
支持角色和细粒度权限的灵活权限系统。

### 3. 会话管理
自动会话超时和活动跟踪以确保安全。

### 4. 多因素认证
支持基于 TOTP 的 MFA 设置和管理。

### 5. 社交认证
与 Google 和 GitHub 等 OAuth 提供商集成。

## 安全最佳实践

1. **安全令牌存储** - 在生产环境中使用 httpOnly cookies
2. **令牌轮换** - 实现自动令牌刷新
3. **会话超时** - 无活动后自动登出
4. **MFA 支持** - 可选的双因素认证
5. **活动记录** - 跟踪安全相关事件
6. **输入验证** - 验证所有用户输入
7. **仅 HTTPS** - 永远不要通过 HTTP 传输凭据

## 相关内容

- [路由守卫](../guide/routing.md)
- [测试](../guide/testing.md)
- [插件](../guide/plugins.md)
- [SSR](../guide/ssr.md)