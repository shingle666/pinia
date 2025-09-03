# Routing Integration

Pinia integrates seamlessly with Vue Router to provide powerful state management for routing-related functionality. This guide covers how to use Pinia with Vue Router for navigation state, route guards, and dynamic routing scenarios.

## Basic Router Integration

### Router Store

Create a store to manage routing state:

```typescript
import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'

export const useRouterStore = defineStore('router', () => {
  const router = useRouter()
  const route = useRoute()
  
  const currentRoute = ref(route)
  const navigationHistory = ref<string[]>([])
  const isNavigating = ref(false)

  // Update current route when route changes
  watch(route, (newRoute) => {
    currentRoute.value = newRoute
    navigationHistory.value.push(newRoute.fullPath)
    
    // Keep only last 10 routes in history
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
      console.error('Navigation failed:', error)
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

### Route Parameters Store

Manage route parameters and query strings:

```typescript
export const useRouteParamsStore = defineStore('routeParams', () => {
  const route = useRoute()
  const router = useRouter()

  const params = computed(() => route.params)
  const query = computed(() => route.query)
  const hash = computed(() => route.hash)

  function updateQuery(newQuery: Record<string, any>, options?: { replace?: boolean }) {
    const updatedQuery = { ...route.query, ...newQuery }
    
    // Remove null/undefined values
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

## Route Guards with Pinia

### Authentication Guard

```typescript
import { useAuthStore } from '@/stores/auth'

export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    
    // Check if route requires authentication
    if (to.meta.requiresAuth) {
      if (!authStore.isAuthenticated) {
        // Try to restore session from token
        try {
          await authStore.restoreSession()
        } catch (error) {
          console.error('Failed to restore session:', error)
        }
        
        if (!authStore.isAuthenticated) {
          next({
            name: 'login',
            query: { redirect: to.fullPath }
          })
          return
        }
      }
      
      // Check role-based permissions
      if (to.meta.roles && !authStore.hasAnyRole(to.meta.roles)) {
        next({ name: 'forbidden' })
        return
      }
    }
    
    // Redirect authenticated users away from auth pages
    if (to.meta.guestOnly && authStore.isAuthenticated) {
      next({ name: 'dashboard' })
      return
    }
    
    next()
  })
}
```

### Permission Guard

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

## Dynamic Routing

### Dynamic Menu Store

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
      // Check permissions
      if (item.permissions && !item.permissions.some(p => permissionStore.hasPermission(p))) {
        return false
      }
      
      // Check roles
      if (item.roles && !permissionStore.hasAnyRole(item.roles)) {
        return false
      }
      
      // Filter children recursively
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
      console.error('Failed to load menu items:', error)
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

### Dynamic Route Registration

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
      console.error('Failed to register user routes:', error)
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

## Breadcrumb Navigation

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
    // Custom breadcrumbs can be set manually if needed
    // This would override the computed breadcrumbs
  }

  return {
    breadcrumbs
  }
})
```

## Route-based Data Loading

### Page Data Store

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
        throw new Error(`Failed to load page data: ${response.statusText}`)
      }

      const data = await response.json()
      pageData.value[cacheKey] = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
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

  // Auto-load data when route changes
  watch(
    () => route.name,
    async (newRouteName) => {
      if (newRouteName && route.meta.loadData) {
        try {
          await loadPageData(newRouteName as string, route.params)
        } catch (error) {
          console.error('Failed to load page data:', error)
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

## Route Transitions

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

  // Determine transition based on route meta
  function getTransitionForRoute(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    if (to.meta.transition) {
      return to.meta.transition
    }
    
    // Default transitions based on route depth
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

## Testing Router Integration

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useRouterStore } from './router'

describe('Router Store', () => {
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

  it('should track navigation history', async () => {
    const store = useRouterStore()
    
    await router.push('/')
    await router.push('/about')
    
    expect(store.navigationHistory).toHaveLength(2)
    expect(store.canGoBack).toBe(true)
  })

  it('should handle navigation errors', async () => {
    const store = useRouterStore()
    
    // Mock router.push to throw an error
    vi.spyOn(router, 'push').mockRejectedValue(new Error('Navigation failed'))
    
    await expect(store.navigateTo('/invalid')).rejects.toThrow('Navigation failed')
    expect(store.isNavigating).toBe(false)
  })
})
```

## Best Practices

### 1. Lazy Load Route Data

```typescript
// Only load data when the route is actually visited
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

### 2. Cache Route Data

```typescript
// Cache frequently accessed route data
const cachedData = new Map()

function getCachedRouteData(key: string) {
  return cachedData.get(key)
}

function setCachedRouteData(key: string, data: any) {
  cachedData.set(key, data)
}
```

### 3. Handle Route Errors Gracefully

```typescript
router.onError((error) => {
  const errorStore = useErrorStore()
  errorStore.addError('Navigation failed', error.message)
})
```

### 4. Clean Up on Route Leave

```typescript
router.beforeEach((to, from, next) => {
  // Clean up any route-specific data
  const pageDataStore = usePageDataStore()
  if (from.meta.clearOnLeave) {
    pageDataStore.clearPageData(from.name)
  }
  next()
})
```

By integrating Pinia with Vue Router using these patterns, you can create sophisticated routing solutions that handle authentication, permissions, dynamic routes, and complex navigation scenarios while maintaining clean, testable code.