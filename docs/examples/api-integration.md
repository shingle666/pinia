---
title: API Integration Example
description: A comprehensive example showing how to integrate Pinia with REST APIs, including data fetching, caching, error handling, and optimistic updates.
head:
  - [meta, { name: description, content: "A comprehensive example showing how to integrate Pinia with REST APIs, including data fetching, caching, error handling, and optimistic updates." }]
  - [meta, { name: keywords, content: "Pinia API, REST integration, data fetching, Vue API store" }]
---

# API Integration Example

This example demonstrates how to integrate Pinia with REST APIs effectively. It includes data fetching, caching strategies, error handling, optimistic updates, and pagination.

## Overview

The API integration example showcases:

- RESTful API integration
- Data fetching and caching
- Error handling and retry logic
- Optimistic updates
- Pagination and infinite scrolling
- Request deduplication
- Background data synchronization
- Offline support
- Request/response interceptors

## Features

- ✅ GET, POST, PUT, DELETE operations
- ✅ Request caching and invalidation
- ✅ Error handling with retry
- ✅ Loading states management
- ✅ Optimistic updates
- ✅ Pagination support
- ✅ Request deduplication
- ✅ Background refresh
- ✅ Offline queue
- ✅ Request cancellation
- ✅ Response transformation

## Type Definitions

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
  // State
  const cache = ref<Map<string, CacheEntry>>(new Map())
  const loading = ref<LoadingState>({})
  const errors = ref<ErrorState>({})
  const pendingRequests = ref<Map<string, AbortController>>(new Map())
  const offlineQueue = ref<RequestConfig[]>([])
  const isOnline = ref(navigator.onLine)
  const retryQueue = ref<Array<{ config: RequestConfig; attempt: number }>>([])
  
  // Posts specific state
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
  
  // Computed
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
  
  // Utility functions
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
  
  // Core API methods
  const request = async <T = any>(config: RequestConfig): Promise<T> => {
    const cacheKey = generateCacheKey(config)
    const loadingKey = `${config.method}:${config.url}`
    
    // Check cache for GET requests
    if (config.method === 'GET' && config.cache !== false) {
      const cached = cache.value.get(cacheKey)
      if (cached && isCacheValid(cached)) {
        return cached.data
      }
    }
    
    // Check for duplicate requests
    if (pendingRequests.value.has(cacheKey)) {
      // Wait for existing request
      return new Promise((resolve, reject) => {
        const checkRequest = () => {
          if (!pendingRequests.value.has(cacheKey)) {
            const cached = cache.value.get(cacheKey)
            if (cached) {
              resolve(cached.data)
            } else {
              reject(new Error('Request failed'))
            }
          } else {
            setTimeout(checkRequest, 100)
          }
        }
        checkRequest()
      })
    }
    
    // Handle offline requests
    if (!isOnline.value && config.method !== 'GET') {
      offlineQueue.value.push(config)
      throw new Error('Request queued for when online')
    }
    
    setLoading(loadingKey, true)
    clearError(loadingKey)
    
    // Create abort controller
    const abortController = new AbortController()
    pendingRequests.value.set(cacheKey, abortController)
    
    try {
      const url = new URL(config.url, window.location.origin)
      
      // Add query parameters
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
      
      // Cache successful GET requests
      if (config.method === 'GET' && config.cache !== false) {
        const ttl = config.cacheTTL || 5 * 60 * 1000 // 5 minutes default
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
        throw new Error('Request cancelled')
      }
      
      const apiError = error as ApiError
      setError(loadingKey, apiError)
      
      // Retry logic
      if (config.retries && config.retries > 0) {
        const retryConfig = { ...config, retries: config.retries - 1 }
        retryQueue.value.push({ config: retryConfig, attempt: 1 })
        
        // Retry after delay
        setTimeout(() => {
          processRetryQueue()
        }, 1000 * Math.pow(2, 1)) // Exponential backoff
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
  
  // Posts API methods
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
      console.error('Failed to fetch posts:', error)
      throw error
    }
  }
  
  const fetchPost = async (id: string) => {
    try {
      const response = await get<ApiResponse<Post>>(`/api/posts/${id}`)
      currentPost.value = response.data
      
      // Update post in list if it exists
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index] = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch post:', error)
      throw error
    }
  }
  
  const createPost = async (data: CreatePostData) => {
    try {
      // Optimistic update
      const tempPost: Post = {
        id: `temp-${Date.now()}`,
        ...data,
        author: { id: 'current-user', name: 'You' },
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        comments: 0
      }
      
      posts.value.unshift(tempPost)
      
      const response = await post<ApiResponse<Post>>('/api/posts', data, {
        optimistic: true
      })
      
      // Replace temp post with real post
      const tempIndex = posts.value.findIndex(post => post.id === tempPost.id)
      if (tempIndex !== -1) {
        posts.value[tempIndex] = response.data
      }
      
      // Invalidate cache
      invalidateCache('/api/posts')
      
      return response.data
    } catch (error) {
      // Revert optimistic update
      const tempIndex = posts.value.findIndex(post => post.id.startsWith('temp-'))
      if (tempIndex !== -1) {
        posts.value.splice(tempIndex, 1)
      }
      
      console.error('Failed to create post:', error)
      throw error
    }
  }
  
  const updatePost = async (data: UpdatePostData) => {
    try {
      // Optimistic update
      const index = posts.value.findIndex(post => post.id === data.id)
      let originalPost: Post | null = null
      
      if (index !== -1) {
        originalPost = { ...posts.value[index] }
        posts.value[index] = { ...posts.value[index], ...data, updatedAt: new Date().toISOString() }
      }
      
      const response = await put<ApiResponse<Post>>(`/api/posts/${data.id}`, data, {
        optimistic: true
      })
      
      // Update with server response
      if (index !== -1) {
        posts.value[index] = response.data
      }
      
      if (currentPost.value?.id === data.id) {
        currentPost.value = response.data
      }
      
      // Invalidate cache
      invalidateCache(`/api/posts/${data.id}`)
      invalidateCache('/api/posts')
      
      return response.data
    } catch (error) {
      // Revert optimistic update
      if (originalPost && index !== -1) {
        posts.value[index] = originalPost
      }
      
      console.error('Failed to update post:', error)
      throw error
    }
  }
  
  const deletePost = async (id: string) => {
    try {
      // Optimistic update
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
      
      // Invalidate cache
      invalidateCache(`/api/posts/${id}`)
      invalidateCache('/api/posts')
      
    } catch (error) {
      // Revert optimistic update
      if (removedPost && index !== -1) {
        posts.value.splice(index, 0, removedPost)
      }
      
      console.error('Failed to delete post:', error)
      throw error
    }
  }
  
  const likePost = async (id: string) => {
    try {
      // Optimistic update
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index].likes++
      }
      
      if (currentPost.value?.id === id) {
        currentPost.value.likes++
      }
      
      await post(`/api/posts/${id}/like`, {}, { optimistic: true })
      
    } catch (error) {
      // Revert optimistic update
      if (index !== -1) {
        posts.value[index].likes--
      }
      
      if (currentPost.value?.id === id) {
        currentPost.value.likes--
      }
      
      console.error('Failed to like post:', error)
      throw error
    }
  }
  
  // Cache management
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
  
  // Background sync
  const syncOfflineQueue = async () => {
    if (!isOnline.value || offlineQueue.value.length === 0) return
    
    const queue = [...offlineQueue.value]
    offlineQueue.value = []
    
    for (const config of queue) {
      try {
        await request(config)
      } catch (error) {
        console.error('Failed to sync offline request:', error)
        // Re-queue failed requests
        offlineQueue.value.push(config)
      }
    }
  }
  
  const refreshData = async () => {
    // Clear cache and refetch current data
    clearCache()
    
    if (posts.value.length > 0) {
      await fetchPosts(1, postsPagination.value.limit, postsFilters.value)
    }
    
    if (currentPost.value) {
      await fetchPost(currentPost.value.id)
    }
  }
  
  // Setup online/offline listeners
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
    
    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
  
  // Auto-refresh data periodically
  const setupAutoRefresh = (interval = 5 * 60 * 1000) => { // 5 minutes
    const timer = setInterval(() => {
      if (isOnline.value && document.visibilityState === 'visible') {
        refreshData()
      }
    }, interval)
    
    return () => clearInterval(timer)
  }
  
  // Initialize
  const cleanup = setupNetworkListeners()
  const autoRefreshCleanup = setupAutoRefresh()
  
  return {
    // State
    posts: readonly(posts),
    currentPost: readonly(currentPost),
    postsFilters: readonly(postsFilters),
    postsPagination: readonly(postsPagination),
    isOnline: readonly(isOnline),
    offlineQueue: readonly(offlineQueue),
    
    // Computed
    isLoading,
    getError,
    filteredPosts,
    
    // Core API methods
    request,
    get,
    post,
    put,
    del,
    
    // Posts methods
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    likePost,
    
    // Cache management
    invalidateCache,
    clearCache,
    
    // Request management
    cancelRequest,
    cancelAllRequests,
    
    // Sync methods
    syncOfflineQueue,
    refreshData,
    
    // Cleanup
    cleanup: () => {
      cleanup()
      autoRefreshCleanup()
      cancelAllRequests()
    }
  }
})
```

## Component Usage

### Posts List Component

```vue
<!-- components/PostsList.vue -->
<template>
  <div class="posts-list">
    <div class="posts-header">
      <h2>Posts</h2>
      <button @click="refreshPosts" :disabled="apiStore.isLoading('GET:/api/posts')">
        {{ apiStore.isLoading('GET:/api/posts') ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>
    
    <div class="posts-filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search posts..."
        @input="debouncedSearch"
      />
      
      <select v-model="statusFilter" @change="applyFilters">
        <option value="">All Status</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>
    </div>
    
    <div v-if="apiStore.getError('GET:/api/posts')" class="error">
      {{ apiStore.getError('GET:/api/posts')?.message }}
      <button @click="retryFetch">Retry</button>
    </div>
    
    <div v-if="apiStore.isLoading('GET:/api/posts') && !apiStore.posts.length" class="loading">
      Loading posts...
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
          <span>By {{ post.author.name }}</span>
          <span>{{ formatDate(post.publishedAt) }}</span>
          <span class="status" :class="post.status">{{ post.status }}</span>
        </div>
        
        <div class="post-actions">
          <button @click="likePost(post.id)" :disabled="post.id.startsWith('temp-')">
            ❤️ {{ post.likes }}
          </button>
          
          <button @click="editPost(post)" :disabled="post.id.startsWith('temp-')">
            Edit
          </button>
          
          <button 
            @click="deletePost(post.id)" 
            :disabled="post.id.startsWith('temp-')"
            class="danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="apiStore.postsPagination.hasNext" class="pagination">
      <button 
        @click="loadMore"
        :disabled="apiStore.isLoading('GET:/api/posts')"
      >
        {{ apiStore.isLoading('GET:/api/posts') ? 'Loading...' : 'Load More' }}
      </button>
    </div>
    
    <div v-if="!apiStore.isOnline" class="offline-notice">
      You're offline. Changes will be synced when connection is restored.
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
    console.error('Failed to like post:', error)
  }
}

const editPost = (post: Post) => {
  // Navigate to edit page or open modal
  console.log('Edit post:', post)
}

const deletePost = async (id: string) => {
  if (confirm('Are you sure you want to delete this post?')) {
    try {
      await apiStore.deletePost(id)
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  apiStore.fetchPosts()
})

onUnmounted(() => {
  clearTimeout(searchTimeout)
})
</script>
```

### Create Post Component

```vue
<!-- components/CreatePost.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="create-post-form">
    <div class="form-group">
      <label for="title">Title</label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        required
        :disabled="apiStore.isLoading('POST:/api/posts')"
      />
    </div>
    
    <div class="form-group">
      <label for="content">Content</label>
      <textarea
        id="content"
        v-model="form.content"
        rows="10"
        required
        :disabled="apiStore.isLoading('POST:/api/posts')"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="tags">Tags</label>
      <input
        id="tags"
        v-model="tagsInput"
        type="text"
        placeholder="Enter tags separated by commas"
        :disabled="apiStore.isLoading('POST:/api/posts')"
      />
    </div>
    
    <div class="form-group">
      <label for="status">Status</label>
      <select
        id="status"
        v-model="form.status"
        :disabled="apiStore.isLoading('POST:/api/posts')"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
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
        {{ apiStore.isLoading('POST:/api/posts') ? 'Creating...' : 'Create Post' }}
      </button>
      
      <button type="button" @click="resetForm">
        Reset
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
    // Parse tags
    form.value.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    const post = await apiStore.createPost(form.value)
    
    emit('created', post)
    resetForm()
    
  } catch (error) {
    console.error('Failed to create post:', error)
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

## Testing

```ts
// tests/api.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useApiStore } from '../stores/api'

// Mock fetch
global.fetch = vi.fn()

describe('API Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  it('fetches posts successfully', async () => {
    const apiStore = useApiStore()
    
    const mockResponse = {
      data: [
        {
          id: '1',
          title: 'Test Post',
          content: 'Test content',
          author: { id: '1', name: 'Test Author' },
          tags: ['test'],
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
    expect(apiStore.posts[0].title).toBe('Test Post')
  })
  
  it('handles API errors', async () => {
    const apiStore = useApiStore()
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server Error' })
    } as Response)
    
    await expect(apiStore.fetchPosts()).rejects.toThrow('Server Error')
    expect(apiStore.getError('GET:/api/posts')?.message).toBe('Server Error')
  })
  
  it('performs optimistic updates', async () => {
    const apiStore = useApiStore()
    
    // Set initial posts
    apiStore.posts = [{
      id: '1',
      title: 'Original Title',
      content: 'Original content',
      author: { id: '1', name: 'Author' },
      tags: [],
      publishedAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      likes: 5,
      comments: 0,
      status: 'published'
    }]
    
    // Mock successful like request
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response)
    
    await apiStore.likePost('1')
    
    expect(apiStore.posts[0].likes).toBe(6)
  })
  
  it('caches GET requests', async () => {
    const apiStore = useApiStore()
    
    const mockData = { data: 'test' }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    } as Response)
    
    // First request
    const result1 = await apiStore.get('/api/test')
    expect(result1).toEqual(mockData)
    expect(fetch).toHaveBeenCalledTimes(1)
    
    // Second request should use cache
    const result2 = await apiStore.get('/api/test')
    expect(result2).toEqual(mockData)
    expect(fetch).toHaveBeenCalledTimes(1) // Still only called once
  })
})
```

## Key Concepts

### 1. Request Caching
Automatic caching of GET requests with configurable TTL.

### 2. Optimistic Updates
Immediate UI updates with rollback on failure.

### 3. Error Handling
Comprehensive error handling with retry logic.

### 4. Request Deduplication
Prevents duplicate requests for the same resource.

### 5. Offline Support
Queues requests when offline and syncs when online.

## Best Practices

1. **Cache Strategy** - Cache GET requests, invalidate on mutations
2. **Error Boundaries** - Handle errors gracefully with user feedback
3. **Loading States** - Show loading indicators for better UX
4. **Optimistic Updates** - Update UI immediately, revert on failure
5. **Request Cancellation** - Cancel pending requests when needed
6. **Retry Logic** - Implement exponential backoff for failed requests
7. **Offline Handling** - Queue mutations when offline

## Related

- [Error Handling](../guide/error-handling.md)
- [Testing](../guide/testing.md)
- [Performance](../guide/performance.md)
- [TypeScript](../guide/typescript.md)