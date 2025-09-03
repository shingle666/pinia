---
title: API 集成示例
description: 一个全面的示例，展示如何有效地将 Pinia 与 REST API 集成，包括数据获取、缓存、错误处理和乐观更新。
head:
  - [meta, { name: description, content: "一个全面的示例，展示如何有效地将 Pinia 与 REST API 集成，包括数据获取、缓存、错误处理和乐观更新。" }]
  - [meta, { name: keywords, content: "Pinia API, REST 集成, 数据获取, Vue API Store" }]
---

# API 集成示例

这个示例演示了如何有效地将 Pinia 与 REST API 集成。它包括数据获取、缓存策略、错误处理、乐观更新和分页。

## 概述

API 集成示例展示了：

- RESTful API 集成
- 数据获取和缓存
- 错误处理和重试逻辑
- 乐观更新
- 分页和无限滚动
- 请求去重
- 后台数据同步
- 离线支持
- 请求/响应拦截器

## 功能特性

- ✅ GET、POST、PUT、DELETE 操作
- ✅ 请求缓存和失效
- ✅ 错误处理和重试
- ✅ 加载状态管理
- ✅ 乐观更新
- ✅ 分页支持
- ✅ 请求去重
- ✅ 后台刷新
- ✅ 离线队列
- ✅ 请求取消
- ✅ 响应转换

## 类型定义

```ts
// types/api.ts
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  timestamp: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  success: boolean
}

export interface ApiError {
  message: string
  code: string
  status: number
  details?: Record<string, any>
  timestamp: string
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  cache?: boolean
  cacheTTL?: number
  optimistic?: boolean
  background?: boolean
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export interface LoadingState {
  [key: string]: boolean
}

export interface ErrorState {
  [key: string]: ApiError | null
}

export interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  tags: string[]
  publishedAt: string
  updatedAt: string
  likes: number
  comments: number
  status: 'draft' | 'published' | 'archived'
}

export interface CreatePostData {
  title: string
  content: string
  tags: string[]
  status: 'draft' | 'published'
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: string
}

export interface PostFilters {
  author?: string
  tags?: string[]
  status?: Post['status']
  search?: string
  dateFrom?: string
  dateTo?: string
}
```

## API Store

```ts
// stores/api.ts
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { 
  ApiResponse, 
  PaginatedResponse, 
  ApiError, 
  RequestConfig, 
  CacheEntry,
  LoadingState,
  ErrorState,
  Post,
  CreatePostData,
  UpdatePostData,
  PostFilters
} from '../types/api'

export const useApiStore = defineStore('api', () => {
  // 状态
  const cache = ref<Map<string, CacheEntry>>(new Map())
  const loading = ref<LoadingState>({})
  const errors = ref<ErrorState>({})
  const pendingRequests = ref<Map<string, AbortController>>(new Map())
  const offlineQueue = ref<RequestConfig[]>([])
  const isOnline = ref(navigator.onLine)
  const retryQueue = ref<Array<{ config: RequestConfig; attempt: number }>>([])
  
  // 文章相关状态
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const postsFilters = ref<PostFilters>({})
  const postsPagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  
  // 计算属性
  const isLoading = computed(() => {
    return (key: string) => loading.value[key] || false
  })
  
  const getError = computed(() => {
    return (key: string) => errors.value[key] || null
  })
  
  const filteredPosts = computed(() => {
    let filtered = posts.value
    
    if (postsFilters.value.author) {
      filtered = filtered.filter(post => 
        post.author.id === postsFilters.value.author
      )
    }
    
    if (postsFilters.value.tags?.length) {
      filtered = filtered.filter(post => 
        postsFilters.value.tags!.some(tag => post.tags.includes(tag))
      )
    }
    
    if (postsFilters.value.status) {
      filtered = filtered.filter(post => 
        post.status === postsFilters.value.status
      )
    }
    
    if (postsFilters.value.search) {
      const search = postsFilters.value.search.toLowerCase()
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(search) ||
        post.content.toLowerCase().includes(search)
      )
    }
    
    return filtered
  })
  
  // 工具函数
  const generateCacheKey = (config: RequestConfig): string => {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`
  }
  
  const isCacheValid = (entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp < entry.ttl
  }
  
  const setLoading = (key: string, value: boolean) => {
    loading.value[key] = value
  }
  
  const setError = (key: string, error: ApiError | null) => {
    errors.value[key] = error
  }
  
  const clearError = (key: string) => {
    delete errors.value[key]
  }
  
  // 核心 API 方法
  const request = async <T = any>(config: RequestConfig): Promise<T> => {
    const cacheKey = generateCacheKey(config)
    const loadingKey = `${config.method}:${config.url}`
    
    // 检查 GET 请求的缓存
    if (config.method === 'GET' && config.cache !== false) {
      const cached = cache.value.get(cacheKey)
      if (cached && isCacheValid(cached)) {
        return cached.data
      }
    }
    
    // 检查重复请求
    if (pendingRequests.value.has(cacheKey)) {
      // 等待现有请求
      return new Promise((resolve, reject) => {
        const checkRequest = () => {
          if (!pendingRequests.value.has(cacheKey)) {
            const cached = cache.value.get(cacheKey)
            if (cached) {
              resolve(cached.data)
            } else {
              reject(new Error('请求失败'))
            }
          } else {
            setTimeout(checkRequest, 100)
          }
        }
        checkRequest()
      })
    }
    
    // 处理离线请求
    if (!isOnline.value && config.method !== 'GET') {
      offlineQueue.value.push(config)
      throw new Error('请求已排队等待在线时处理')
    }
    
    setLoading(loadingKey, true)
    clearError(loadingKey)
    
    // 创建中止控制器
    const abortController = new AbortController()
    pendingRequests.value.set(cacheKey, abortController)
    
    try {
      const url = new URL(config.url, window.location.origin)
      
      // 添加查询参数
      if (config.params) {
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value))
          }
        })
      }
      
      const requestInit: RequestInit = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        signal: abortController.signal
      }
      
      if (config.data && config.method !== 'GET') {
        requestInit.body = JSON.stringify(config.data)
      }
      
      const response = await fetch(url.toString(), requestInit)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const apiError: ApiError = {
          message: errorData.message || `HTTP ${response.status}`,
          code: errorData.code || 'HTTP_ERROR',
          status: response.status,
          details: errorData.details,
          timestamp: new Date().toISOString()
        }
        throw apiError
      }
      
      const data = await response.json()
      
      // 缓存成功的 GET 请求
      if (config.method === 'GET' && config.cache !== false) {
        const ttl = config.cacheTTL || 5 * 60 * 1000 // 默认 5 分钟
        cache.value.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl,
          key: cacheKey
        })
      }
      
      return data
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求已取消')
      }
      
      const apiError = error as ApiError
      setError(loadingKey, apiError)
      
      // 重试逻辑
      if (config.retries && config.retries > 0) {
        const retryConfig = { ...config, retries: config.retries - 1 }
        retryQueue.value.push({ config: retryConfig, attempt: 1 })
        
        // 延迟后重试
        setTimeout(() => {
          processRetryQueue()
        }, 1000 * Math.pow(2, 1)) // 指数退避
      }
      
      throw apiError
      
    } finally {
      setLoading(loadingKey, false)
      pendingRequests.value.delete(cacheKey)
    }
  }
  
  const processRetryQueue = async () => {
    const retries = [...retryQueue.value]
    retryQueue.value = []
    
    for (const { config, attempt } of retries) {
      try {
        await request(config)
      } catch (error) {
        if (config.retries && config.retries > 0) {
          retryQueue.value.push({ 
            config: { ...config, retries: config.retries - 1 }, 
            attempt: attempt + 1 
          })
        }
      }
    }
  }
  
  const get = <T = any>(url: string, params?: Record<string, any>, options?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      method: 'GET',
      url,
      params,
      cache: true,
      ...options
    })
  }
  
  const post = <T = any>(url: string, data?: any, options?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      method: 'POST',
      url,
      data,
      ...options
    })
  }
  
  const put = <T = any>(url: string, data?: any, options?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      method: 'PUT',
      url,
      data,
      ...options
    })
  }
  
  const del = <T = any>(url: string, options?: Partial<RequestConfig>): Promise<T> => {
    return request<T>({
      method: 'DELETE',
      url,
      ...options
    })
  }
  
  // 文章 API 方法
  const fetchPosts = async (page = 1, limit = 10, filters?: PostFilters) => {
    try {
      const params = {
        page,
        limit,
        ...filters
      }
      
      const response = await get<PaginatedResponse<Post>>('/api/posts', params)
      
      if (page === 1) {
        posts.value = response.data
      } else {
        posts.value.push(...response.data)
      }
      
      postsPagination.value = response.pagination
      postsFilters.value = filters || {}
      
      return response
    } catch (error) {
      console.error('获取文章失败:', error)
      throw error
    }
  }
  
  const fetchPost = async (id: string) => {
    try {
      const response = await get<ApiResponse<Post>>(`/api/posts/${id}`)
      currentPost.value = response.data
      
      // 如果文章存在于列表中，则更新它
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index] = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('获取文章失败:', error)
      throw error
    }
  }
  
  const createPost = async (data: CreatePostData) => {
    try {
      // 乐观更新
      const tempPost: Post = {
        id: `temp-${Date.now()}`,
        ...data,
        author: { id: 'current-user', name: '您' },
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        comments: 0
      }
      
      posts.value.unshift(tempPost)
      
      const response = await post<ApiResponse<Post>>('/api/posts', data, {
        optimistic: true
      })
      
      // 用真实文章替换临时文章
      const tempIndex = posts.value.findIndex(post => post.id === tempPost.id)
      if (tempIndex !== -1) {
        posts.value[tempIndex] = response.data
      }
      
      // 使缓存失效
      invalidateCache('/api/posts')
      
      return response.data
    } catch (error) {
      // 回滚乐观更新
      const tempIndex = posts.value.findIndex(post => post.id.startsWith('temp-'))
      if (tempIndex !== -1) {
        posts.value.splice(tempIndex, 1)
      }
      
      console.error('创建文章失败:', error)
      throw error
    }
  }
  
  const updatePost = async (data: UpdatePostData) => {
    try {
      // 乐观更新
      const index = posts.value.findIndex(post => post.id === data.id)
      let originalPost: Post | null = null
      
      if (index !== -1) {
        originalPost = { ...posts.value[index] }
        posts.value[index] = { ...posts.value[index], ...data, updatedAt: new Date().toISOString() }
      }
      
      const response = await put<ApiResponse<Post>>(`/api/posts/${data.id}`, data, {
        optimistic: true
      })
      
      // 用服务器响应更新
      if (index !== -1) {
        posts.value[index] = response.data
      }
      
      if (currentPost.value?.id === data.id) {
        currentPost.value = response.data
      }
      
      // 使缓存失效
      invalidateCache(`/api/posts/${data.id}`)
      invalidateCache('/api/posts')
      
      return response.data
    } catch (error) {
      // 回滚乐观更新
      if (originalPost && index !== -1) {
        posts.value[index] = originalPost
      }
      
      console.error('更新文章失败:', error)
      throw error
    }
  }
  
  const deletePost = async (id: string) => {
    try {
      // 乐观更新
      const index = posts.value.findIndex(post => post.id === id)
      let removedPost: Post | null = null
      
      if (index !== -1) {
        removedPost = posts.value[index]
        posts.value.splice(index, 1)
      }
      
      await del(`/api/posts/${id}`, { optimistic: true })
      
      if (currentPost.value?.id === id) {
        currentPost.value = null
      }
      
      // 使缓存失效
      invalidateCache(`/api/posts/${id}`)
      invalidateCache('/api/posts')
      
    } catch (error) {
      // 回滚乐观更新
      if (removedPost && index !== -1) {
        posts.value.splice(index, 0, removedPost)
      }
      
      console.error('删除文章失败:', error)
      throw error
    }
  }
  
  const likePost = async (id: string) => {
    try {
      // 乐观更新
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index].likes++
      }
      
      if (currentPost.value?.id === id) {
        currentPost.value.likes++
      }
      
      await post(`/api/posts/${id}/like`, {}, { optimistic: true })
      
    } catch (error) {
      // 回滚乐观更新
      if (index !== -1) {
        posts.value[index].likes--
      }
      
      if (currentPost.value?.id === id) {
        currentPost.value.likes--
      }
      
      console.error('点赞文章失败:', error)
      throw error
    }
  }
  
  // 缓存管理
  const invalidateCache = (pattern?: string) => {
    if (!pattern) {
      cache.value.clear()
      return
    }
    
    for (const [key] of cache.value) {
      if (key.includes(pattern)) {
        cache.value.delete(key)
      }
    }
  }
  
  const clearCache = () => {
    cache.value.clear()
  }
  
  const cancelRequest = (url: string, method = 'GET') => {
    const pattern = `${method}:${url}`
    for (const [key, controller] of pendingRequests.value) {
      if (key.startsWith(pattern)) {
        controller.abort()
        pendingRequests.value.delete(key)
      }
    }
  }
  
  const cancelAllRequests = () => {
    for (const [key, controller] of pendingRequests.value) {
      controller.abort()
    }
    pendingRequests.value.clear()
  }
  
  // 后台同步
  const syncOfflineQueue = async () => {
    if (!isOnline.value || offlineQueue.value.length === 0) return
    
    const queue = [...offlineQueue.value]
    offlineQueue.value = []
    
    for (const config of queue) {
      try {
        await request(config)
      } catch (error) {
        console.error('同步离线请求失败:', error)
        // 重新排队失败的请求
        offlineQueue.value.push(config)
      }
    }
  }
  
  const refreshData = async () => {
    // 清除缓存并重新获取当前数据
    clearCache()
    
    if (posts.value.length > 0) {
      await fetchPosts(1, postsPagination.value.limit, postsFilters.value)
    }
    
    if (currentPost.value) {
      await fetchPost(currentPost.value.id)
    }
  }
  
  // 设置在线/离线监听器
  const setupNetworkListeners = () => {
    const handleOnline = () => {
      isOnline.value = true
      syncOfflineQueue()
    }
    
    const handleOffline = () => {
      isOnline.value = false
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // 清理函数
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
  
  // 定期自动刷新数据
  const setupAutoRefresh = (interval = 5 * 60 * 1000) => { // 5 分钟
    const timer = setInterval(() => {
      if (isOnline.value && document.visibilityState === 'visible') {
        refreshData()
      }
    }, interval)
    
    return () => clearInterval(timer)
  }
  
  // 初始化
  const cleanup = setupNetworkListeners()
  const autoRefreshCleanup = setupAutoRefresh()
  
  return {
    // 状态
    posts: readonly(posts),
    currentPost: readonly(currentPost),
    postsFilters: readonly(postsFilters),
    postsPagination: readonly(postsPagination),
    isOnline: readonly(isOnline),
    offlineQueue: readonly(offlineQueue),
    
    // 计算属性
    isLoading,
    getError,
    filteredPosts,
    
    // 核心 API 方法
    request,
    get,
    post,
    put,
    del,
    
    // 文章方法
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    likePost,
    
    // 缓存管理
    invalidateCache,
    clearCache,
    
    // 请求管理
    cancelRequest,
    cancelAllRequests,
    
    // 同步方法
    syncOfflineQueue,
    refreshData,
    
    // 清理
    cleanup: () => {
      cleanup()
      autoRefreshCleanup()
      cancelAllRequests()
    }
  }
})
```

## 组件使用

### 文章列表组件

```vue
<!-- components/PostsList.vue -->
<template>
  <div class="posts-list">
    <div class="posts-header">
      <h2>文章</h2>
      <button @click="refreshPosts" :disabled="apiStore.isLoading('GET:/api/posts')">
        {{ apiStore.isLoading('GET:/api/posts') ? '刷新中...' : '刷新' }}
      </button>
    </div>
    
    <div class="posts-filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索文章..."
        @input="debouncedSearch"
      />
      
      <select v-model="statusFilter" @change="applyFilters">
        <option value="">所有状态</option>
        <option value="published">已发布</option>
        <option value="draft">草稿</option>
        <option value="archived">已归档</option>
      </select>
    </div>
    
    <div v-if="apiStore.getError('GET:/api/posts')" class="error">
      {{ apiStore.getError('GET:/api/posts')?.message }}
      <button @click="retryFetch">重试</button>
    </div>
    
    <div v-if="apiStore.isLoading('GET:/api/posts') && !apiStore.posts.length" class="loading">
      加载文章中...
    </div>
    
    <div class="posts-grid">
      <div
        v-for="post in apiStore.filteredPosts"
        :key="post.id"
        class="post-card"
        :class="{ 'optimistic': post.id.startsWith('temp-') }"
      >
        <h3>{{ post.title }}</h3>
        <p>{{ post.content.substring(0, 150) }}...</p>
        
        <div class="post-meta">
          <span>作者：{{ post.author.name }}</span>
          <span>{{ formatDate(post.publishedAt) }}</span>
          <span class="status" :class="post.status">{{ getStatusText(post.status) }}</span>
        </div>
        
        <div class="post-actions">
          <button @click="likePost(post.id)" :disabled="post.id.startsWith('temp-')">
            ❤️ {{ post.likes }}
          </button>
          
          <button @click="editPost(post)" :disabled="post.id.startsWith('temp-')">
            编辑
          </button>
          
          <button 
            @click="deletePost(post.id)" 
            :disabled="post.id.startsWith('temp-')"
            class="danger"
          >
            删除
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="apiStore.postsPagination.hasNext" class="pagination">
      <button 
        @click="loadMore"
        :disabled="apiStore.isLoading('GET:/api/posts')"
      >
        {{ apiStore.isLoading('GET:/api/posts') ? '加载中...' : '加载更多' }}
      </button>
    </div>
    
    <div v-if="!apiStore.isOnline" class="offline-notice">
      您当前处于离线状态。连接恢复后将同步更改。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useApiStore } from '../stores/api'
import type { Post } from '../types/api'

const apiStore = useApiStore()

const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout: NodeJS.Timeout

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

const applyFilters = async () => {
  const filters = {
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined
  }
  
  await apiStore.fetchPosts(1, 10, filters)
}

const refreshPosts = async () => {
  await apiStore.refreshData()
}

const retryFetch = async () => {
  await apiStore.fetchPosts(1, 10, apiStore.postsFilters)
}

const loadMore = async () => {
  const nextPage = apiStore.postsPagination.page + 1
  await apiStore.fetchPosts(nextPage, 10, apiStore.postsFilters)
}

const likePost = async (id: string) => {
  try {
    await apiStore.likePost(id)
  } catch (error) {
    console.error('点赞文章失败:', error)
  }
}

const editPost = (post: Post) => {
  // 导航到编辑页面或打开模态框
  console.log('编辑文章:', post)
}

const deletePost = async (id: string) => {
  if (confirm('确定要删除这篇文章吗？')) {
    try {
      await apiStore.deletePost(id)
    } catch (error) {
      console.error('删除文章失败:', error)
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap = {
    published: '已发布',
    draft: '草稿',
    archived: '已归档'
  }
  return statusMap[status] || status
}

onMounted(() => {
  apiStore.fetchPosts()
})

onUnmounted(() => {
  clearTimeout(searchTimeout)
})
</script>
```

### 创建文章组件

```vue
<!-- components/CreatePost.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="create-post-form">
    <div class="form-group">
      <label for="title">标题</label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        required
        :disabled="apiStore.isLoading('POST:/api/posts')"
      />
    </div>
    
    <div class="form-group">
      <label for="content">内容</label>
      <textarea
        id="content"
        v-model="form.content"
        rows="10"
        required
        :disabled="apiStore.isLoading('POST:/api/posts')"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="tags">标签</label>
      <input
        id="tags"
        v-model="tagsInput"
        type="text"
        placeholder="输入标签，用逗号分隔"
        :disabled="apiStore.isLoading('POST:/api/posts')"
      />
    </div>
    
    <div class="form-group">
      <label for="status">状态</label>
      <select
        id="status"
        v-model="form.status"
        :disabled="apiStore.isLoading('POST:/api/posts')"
      >
        <option value="draft">草稿</option>
        <option value="published">发布</option>
      </select>
    </div>
    
    <div v-if="apiStore.getError('POST:/api/posts')" class="error">
      {{ apiStore.getError('POST:/api/posts')?.message }}
    </div>
    
    <div class="form-actions">
      <button 
        type="submit" 
        :disabled="apiStore.isLoading('POST:/api/posts')"
      >
        {{ apiStore.isLoading('POST:/api/posts') ? '创建中...' : '创建文章' }}
      </button>
      
      <button type="button" @click="resetForm">
        重置
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useApiStore } from '../stores/api'
import type { CreatePostData } from '../types/api'

const emit = defineEmits<{
  created: [post: any]
}>()

const apiStore = useApiStore()

const form = ref<CreatePostData>({
  title: '',
  content: '',
  tags: [],
  status: 'draft'
})

const tagsInput = ref('')

const handleSubmit = async () => {
  try {
    // 解析标签
    form.value.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    const post = await apiStore.createPost(form.value)
    
    emit('created', post)
    resetForm()
    
  } catch (error) {
    console.error('创建文章失败:', error)
  }
}

const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    tags: [],
    status: 'draft'
  }
  tagsInput.value = ''
}
</script>
```

## 测试

```ts
// tests/api.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useApiStore } from '../stores/api'

// 模拟 fetch
global.fetch = vi.fn()

describe('API Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  it('成功获取文章', async () => {
    const apiStore = useApiStore()
    
    const mockResponse = {
      data: [
        {
          id: '1',
          title: '测试文章',
          content: '测试内容',
          author: { id: '1', name: '测试作者' },
          tags: ['测试'],
          publishedAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          likes: 0,
          comments: 0,
          status: 'published'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      success: true
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)
    
    await apiStore.fetchPosts()
    
    expect(apiStore.posts).toHaveLength(1)
    expect(apiStore.posts[0].title).toBe('测试文章')
  })
  
  it('处理 API 错误', async () => {
    const apiStore = useApiStore()
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: '服务器错误' })
    } as Response)
    
    await expect(apiStore.fetchPosts()).rejects.toThrow('服务器错误')
    expect(apiStore.getError('GET:/api/posts')?.message).toBe('服务器错误')
  })
  
  it('执行乐观更新', async () => {
    const apiStore = useApiStore()
    
    // 设置初始文章
    apiStore.posts = [{
      id: '1',
      title: '原始标题',
      content: '原始内容',
      author: { id: '1', name: '作者' },
      tags: [],
      publishedAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      likes: 5,
      comments: 0,
      status: 'published'
    }]
    
    // 模拟成功的点赞请求
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response)
    
    await apiStore.likePost('1')
    
    expect(apiStore.posts[0].likes).toBe(6)
  })
  
  it('缓存 GET 请求', async () => {
    const apiStore = useApiStore()
    
    const mockData = { data: '测试' }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    } as Response)
    
    // 第一次请求
    const result1 = await apiStore.get('/api/test')
    expect(result1).toEqual(mockData)
    expect(fetch).toHaveBeenCalledTimes(1)
    
    // 第二次请求应该使用缓存
    const result2 = await apiStore.get('/api/test')
    expect(result2).toEqual(mockData)
    expect(fetch).toHaveBeenCalledTimes(1) // 仍然只调用一次
  })
})
```

## 核心概念

### 1. 请求缓存
自动缓存 GET 请求，可配置 TTL。

### 2. 乐观更新
立即更新 UI，失败时回滚。

### 3. 错误处理
全面的错误处理和重试逻辑。

### 4. 请求去重
防止对同一资源的重复请求。

### 5. 离线支持
离线时排队请求，在线时同步。

## 最佳实践

1. **缓存策略** - 缓存 GET 请求，在变更时使缓存失效
2. **错误边界** - 优雅地处理错误并提供用户反馈
3. **加载状态** - 显示加载指示器以改善用户体验
4. **乐观更新** - 立即更新 UI，失败时回滚
5. **请求取消** - 在需要时取消待处理的请求
6. **重试逻辑** - 为失败的请求实现指数退避
7. **离线处理** - 离线时排队变更

## 相关内容

- [错误处理](../guide/error-handling.md)
- [测试](../guide/testing.md)
- [性能](../guide/performance.md)
- [TypeScript](../guide/typescript.md)