# 路由集成

Pinia 与 Vue Router 无缝集成，为路由相关功能提供强大的状态管理。本指南介绍如何将 Pinia 与 Vue Router 结合使用，实现导航状态、路由守卫和动态路由场景。

## 基础路由集成

### 路由存储

创建一个存储来管理路由状态：

```typescript
import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'

export const useRouterStore = defineStore('router', () => {
  const router = useRouter()
  const route = useRoute()
  
  const currentRoute = ref(route)
  const navigationHistory = ref<string[]>([])
  const isNavigating = ref(false)

  // 当路由变化时更新当前路由
  watch(route, (newRoute) => {
    currentRoute.value = newRoute
    navigationHistory.value.push(newRoute.fullPath)
    
    // 只保留最近的10个路由记录
    if (navigationHistory.value.length > 10) {
      navigationHistory.value.shift()
    }
  }, { immediate: true })

  async function navigateTo(path: string, options?: { replace?: boolean }) {
    isNavigating.value = true
    
    try {
      if (options?.replace) {
        await router.replace(path)
      } else {
        await router.push(path)
      }
    } catch (error) {
      console.error('导航失败:', error)
      throw error
    } finally {
      isNavigating.value = false
    }
  }

  function goBack() {
    if (navigationHistory.value.length > 1) {
      router.back()
    }
  }

  function goForward() {
    router.forward()
  }

  const canGoBack = computed(() => navigationHistory.value.length > 1)
  const previousRoute = computed(() => {
    const history = navigationHistory.value
    return history.length > 1 ? history[history.length - 2] : null
  })

  return {
    currentRoute: readonly(currentRoute),
    navigationHistory: readonly(navigationHistory),
    isNavigating: readonly(isNavigating),
    canGoBack,
    previousRoute,
    navigateTo,
    goBack,
    goForward
  }
})
```

### 路由参数存储

管理路由参数和查询字符串：

```typescript
export const useRouteParamsStore = defineStore('routeParams', () => {
  const route = useRoute()
  const router = useRouter()

  const params = computed(() => route.params)
  const query = computed(() => route.query)
  const hash = computed(() => route.hash)

  function updateQuery(newQuery: Record<string, any>, options?: { replace?: boolean }) {
    const updatedQuery = { ...route.query, ...newQuery }
    
    // 移除 null/undefined 值
    Object.keys(updatedQuery).forEach(key => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined) {
        delete updatedQuery[key]
      }
    })

    const method = options?.replace ? 'replace' : 'push'
    router[method]({
      path: route.path,
      query: updatedQuery
    })
  }

  function removeQueryParam(key: string) {
    const newQuery = { ...route.query }
    delete newQuery[key]
    
    router.replace({
      path: route.path,
      query: newQuery
    })
  }

  function clearQuery() {
    router.replace({ path: route.path })
  }

  return {
    params,
    query,
    hash,
    updateQuery,
    removeQueryParam,
    clearQuery
  }
})
```

## 使用 Pinia 的路由守卫

### 身份验证守卫

```typescript
import { useAuthStore } from '@/stores/auth'

export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    
    // 检查路由是否需要身份验证
    if (to.meta.requiresAuth) {
      if (!authStore.isAuthenticated) {
        // 尝试从令牌恢复会话
        try {
          await authStore.restoreSession()
        } catch (error) {
          console.error('恢复会话失败:', error)
        }
        
        if (!authStore.isAuthenticated) {
          next({
            name: 'login',
            query: { redirect: to.fullPath }
          })
          return
        }
      }
      
      // 检查基于角色的权限
      if (to.meta.roles && !authStore.hasAnyRole(to.meta.roles)) {
        next({ name: 'forbidden' })
        return
      }
    }
    
    // 将已认证用户重定向离开认证页面
    if (to.meta.guestOnly && authStore.isAuthenticated) {
      next({ name: 'dashboard' })
      return
    }
    
    next()
  })
}
```

### 权限守卫

```typescript
export const usePermissionStore = defineStore('permission', () => {
  const authStore = useAuthStore()
  
  const permissions = computed(() => authStore.user?.permissions || [])
  const roles = computed(() => authStore.user?.roles || [])

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  function hasAnyRole(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => hasRole(role))
  }

  function hasAllRoles(requiredRoles: string[]): boolean {
    return requiredRoles.every(role => hasRole(role))
  }

  function canAccessRoute(route: RouteLocationNormalized): boolean {
    if (route.meta.permissions) {
      return route.meta.permissions.some(permission => hasPermission(permission))
    }
    
    if (route.meta.roles) {
      return hasAnyRole(route.meta.roles)
    }
    
    return true
  }

  return {
    permissions,
    roles,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccessRoute
  }
})

export function setupPermissionGuard(router: Router) {
  router.beforeEach((to, from, next) => {
    const permissionStore = usePermissionStore()
    
    if (!permissionStore.canAccessRoute(to)) {
      next({ name: 'forbidden' })
      return
    }
    
    next()
  })
}
```

## 动态路由

### 动态菜单存储

```typescript
interface MenuItem {
  id: string
  title: string
  path?: string
  icon?: string
  children?: MenuItem[]
  permissions?: string[]
  roles?: string[]
}

export const useMenuStore = defineStore('menu', () => {
  const permissionStore = usePermissionStore()
  const allMenuItems = ref<MenuItem[]>([])

  const visibleMenuItems = computed(() => {
    return filterMenuByPermissions(allMenuItems.value)
  })

  function filterMenuByPermissions(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      // 检查权限
      if (item.permissions && !item.permissions.some(p => permissionStore.hasPermission(p))) {
        return false
      }
      
      // 检查角色
      if (item.roles && !permissionStore.hasAnyRole(item.roles)) {
        return false
      }
      
      // 递归过滤子项
      if (item.children) {
        item.children = filterMenuByPermissions(item.children)
      }
      
      return true
    })
  }

  async function loadMenuItems() {
    try {
      const response = await fetch('/api/menu')
      allMenuItems.value = await response.json()
    } catch (error) {
      console.error('加载菜单项失败:', error)
    }
  }

  function findMenuItem(path: string): MenuItem | null {
    function search(items: MenuItem[]): MenuItem | null {
      for (const item of items) {
        if (item.path === path) {
          return item
        }
        if (item.children) {
          const found = search(item.children)
          if (found) return found
        }
      }
      return null
    }
    
    return search(visibleMenuItems.value)
  }

  return {
    allMenuItems: readonly(allMenuItems),
    visibleMenuItems,
    loadMenuItems,
    findMenuItem
  }
})
```

### 动态路由注册

```typescript
export const useRouteRegistrationStore = defineStore('routeRegistration', () => {
  const router = useRouter()
  const registeredRoutes = ref<Set<string>>(new Set())

  async function registerUserRoutes(userPermissions: string[]) {
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: userPermissions })
      })
      
      const routes = await response.json()
      
      routes.forEach(route => {
        if (!registeredRoutes.value.has(route.name)) {
          router.addRoute(route)
          registeredRoutes.value.add(route.name)
        }
      })
    } catch (error) {
      console.error('注册用户路由失败:', error)
    }
  }

  function unregisterUserRoutes() {
    registeredRoutes.value.forEach(routeName => {
      router.removeRoute(routeName)
    })
    registeredRoutes.value.clear()
  }

  return {
    registeredRoutes: readonly(registeredRoutes),
    registerUserRoutes,
    unregisterUserRoutes
  }
})
```

## 面包屑导航

```typescript
interface BreadcrumbItem {
  title: string
  path?: string
  disabled?: boolean
}

export const useBreadcrumbStore = defineStore('breadcrumb', () => {
  const route = useRoute()
  const menuStore = useMenuStore()
  
  const breadcrumbs = computed(() => {
    const items: BreadcrumbItem[] = []
    const pathSegments = route.path.split('/').filter(Boolean)
    
    let currentPath = ''
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      const menuItem = menuStore.findMenuItem(currentPath)
      const isLast = index === pathSegments.length - 1
      
      items.push({
        title: menuItem?.title || segment,
        path: isLast ? undefined : currentPath,
        disabled: isLast
      })
    })
    
    return items
  })

  function setBreadcrumbs(items: BreadcrumbItem[]) {
    // 如果需要，可以手动设置自定义面包屑
    // 这将覆盖计算的面包屑
  }

  return {
    breadcrumbs
  }
})
```

## 基于路由的数据加载

### 页面数据存储

```typescript
export const usePageDataStore = defineStore('pageData', () => {
  const route = useRoute()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pageData = ref<Record<string, any>>({})

  async function loadPageData(routeName: string, params?: Record<string, any>) {
    const cacheKey = `${routeName}_${JSON.stringify(params || {})}`
    
    if (pageData.value[cacheKey]) {
      return pageData.value[cacheKey]
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/pages/${routeName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {})
      })

      if (!response.ok) {
        throw new Error(`加载页面数据失败: ${response.statusText}`)
      }

      const data = await response.json()
      pageData.value[cacheKey] = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearPageData(routeName?: string) {
    if (routeName) {
      Object.keys(pageData.value).forEach(key => {
        if (key.startsWith(routeName)) {
          delete pageData.value[key]
        }
      })
    } else {
      pageData.value = {}
    }
  }

  // 路由变化时自动加载数据
  watch(
    () => route.name,
    async (newRouteName) => {
      if (newRouteName && route.meta.loadData) {
        try {
          await loadPageData(newRouteName as string, route.params)
        } catch (error) {
          console.error('加载页面数据失败:', error)
        }
      }
    },
    { immediate: true }
  )

  return {
    loading: readonly(loading),
    error: readonly(error),
    pageData: readonly(pageData),
    loadPageData,
    clearPageData
  }
})
```

## 路由过渡

```typescript
export const useRouteTransitionStore = defineStore('routeTransition', () => {
  const isTransitioning = ref(false)
  const transitionName = ref('fade')
  const transitionMode = ref<'out-in' | 'in-out'>('out-in')

  function setTransition(name: string, mode?: 'out-in' | 'in-out') {
    transitionName.value = name
    if (mode) {
      transitionMode.value = mode
    }
  }

  function startTransition() {
    isTransitioning.value = true
  }

  function endTransition() {
    isTransitioning.value = false
  }

  // 根据路由元信息确定过渡
  function getTransitionForRoute(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    if (to.meta.transition) {
      return to.meta.transition
    }
    
    // 基于路由深度的默认过渡
    const toDepth = to.path.split('/').length
    const fromDepth = from.path.split('/').length
    
    if (toDepth > fromDepth) {
      return 'slide-left'
    } else if (toDepth < fromDepth) {
      return 'slide-right'
    }
    
    return 'fade'
  }

  return {
    isTransitioning: readonly(isTransitioning),
    transitionName: readonly(transitionName),
    transitionMode: readonly(transitionMode),
    setTransition,
    startTransition,
    endTransition,
    getTransitionForRoute
  }
})
```

## 测试路由集成

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useRouterStore } from './router'

describe('路由存储', () => {
  let router: Router
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'home', component: {} },
        { path: '/about', name: 'about', component: {} }
      ]
    })
  })

  it('应该跟踪导航历史', async () => {
    const store = useRouterStore()
    
    await router.push('/')
    await router.push('/about')
    
    expect(store.navigationHistory).toHaveLength(2)
    expect(store.canGoBack).toBe(true)
  })

  it('应该处理导航错误', async () => {
    const store = useRouterStore()
    
    // 模拟 router.push 抛出错误
    vi.spyOn(router, 'push').mockRejectedValue(new Error('导航失败'))
    
    await expect(store.navigateTo('/invalid')).rejects.toThrow('导航失败')
    expect(store.isNavigating).toBe(false)
  })
})
```

## 最佳实践

### 1. 懒加载路由数据

```typescript
// 只在实际访问路由时加载数据
const routes = [
  {
    path: '/users/:id',
    component: UserDetail,
    beforeEnter: async (to) => {
      const userStore = useUserStore()
      await userStore.fetchUser(to.params.id)
    }
  }
]
```

### 2. 缓存路由数据

```typescript
// 缓存频繁访问的路由数据
const cachedData = new Map()

function getCachedRouteData(key: string) {
  return cachedData.get(key)
}

function setCachedRouteData(key: string, data: any) {
  cachedData.set(key, data)
}
```

### 3. 优雅处理路由错误

```typescript
router.onError((error) => {
  const errorStore = useErrorStore()
  errorStore.addError('导航失败', error.message)
})
```

### 4. 离开路由时清理

```typescript
router.beforeEach((to, from, next) => {
  // 清理任何路由特定的数据
  const pageDataStore = usePageDataStore()
  if (from.meta.clearOnLeave) {
    pageDataStore.clearPageData(from.name)
  }
  next()
})
```

通过使用这些模式将 Pinia 与 Vue Router 集成，您可以创建复杂的路由解决方案，处理身份验证、权限、动态路由和复杂的导航场景，同时保持代码的清洁和可测试性。