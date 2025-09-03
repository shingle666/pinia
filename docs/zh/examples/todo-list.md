# 待办事项应用

一个全面的待办事项应用，展示了高级 Pinia 模式，包括嵌套状态管理、复杂过滤、持久化和实时同步。

## 功能特性

- ✅ 创建、编辑和删除待办事项
- 🏷️ 分类和标签
- 📅 截止日期和优先级
- 🔍 高级过滤和搜索
- 💾 本地存储持久化
- 🔄 实时同步
- 📊 统计和分析
- 🎨 拖拽排序
- 📱 响应式设计

## 类型定义

```typescript
// types/todo.ts
export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  categoryId?: string
  tags: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  userId?: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  description?: string
  createdAt: Date
}

export interface TodoFilter {
  search?: string
  completed?: boolean
  priority?: Todo['priority'][]
  categoryId?: string
  tags?: string[]
  dueDateRange?: {
    start?: Date
    end?: Date
  }
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface TodoStats {
  total: number
  completed: number
  pending: number
  overdue: number
  byPriority: Record<Todo['priority'], number>
  byCategory: Record<string, number>
  completionRate: number
  averageCompletionTime: number
}
```

## 存储实现

### 待办事项存储

```typescript
// stores/todos.ts
import { defineStore } from 'pinia'
import { useCategoriesStore } from './categories'
import { useAuthStore } from './auth'

export const useTodosStore = defineStore('todos', () => {
  const categoriesStore = useCategoriesStore()
  const authStore = useAuthStore()

  // 状态
  const todos = ref<Todo[]>([])
  const filter = ref<TodoFilter>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSync = ref<Date | null>(null)
  const selectedTodos = ref<Set<string>>(new Set())

  // 计算属性
  const filteredTodos = computed(() => {
    let result = [...todos.value]

    // 搜索过滤
    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase()
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(searchLower) ||
        todo.description?.toLowerCase().includes(searchLower) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // 完成状态过滤
    if (filter.value.completed !== undefined) {
      result = result.filter(todo => todo.completed === filter.value.completed)
    }

    // 优先级过滤
    if (filter.value.priority?.length) {
      result = result.filter(todo => filter.value.priority!.includes(todo.priority))
    }

    // 分类过滤
    if (filter.value.categoryId) {
      result = result.filter(todo => todo.categoryId === filter.value.categoryId)
    }

    // 标签过滤
    if (filter.value.tags?.length) {
      result = result.filter(todo => 
        filter.value.tags!.some(tag => todo.tags.includes(tag))
      )
    }

    // 截止日期过滤
    if (filter.value.dueDateRange) {
      const { start, end } = filter.value.dueDateRange
      result = result.filter(todo => {
        if (!todo.dueDate) return false
        const dueDate = new Date(todo.dueDate)
        if (start && dueDate < start) return false
        if (end && dueDate > end) return false
        return true
      })
    }

    // 排序
    const sortBy = filter.value.sortBy || 'createdAt'
    const sortOrder = filter.value.sortOrder || 'desc'
    
    result.sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
      }

      if (aValue instanceof Date) aValue = aValue.getTime()
      if (bValue instanceof Date) bValue = bValue.getTime()

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  })

  const todosByCategory = computed(() => {
    const grouped = new Map<string, Todo[]>()
    
    filteredTodos.value.forEach(todo => {
      const categoryId = todo.categoryId || 'uncategorized'
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, [])
      }
      grouped.get(categoryId)!.push(todo)
    })
    
    return grouped
  })

  const overdueTodos = computed(() => {
    const now = new Date()
    return todos.value.filter(todo => 
      !todo.completed && 
      todo.dueDate && 
      new Date(todo.dueDate) < now
    )
  })

  const todayTodos = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return todos.value.filter(todo => {
      if (!todo.dueDate) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate >= today && dueDate < tomorrow
    })
  })

  const stats = computed((): TodoStats => {
    const total = todos.value.length
    const completed = todos.value.filter(t => t.completed).length
    const pending = total - completed
    const overdue = overdueTodos.value.length

    const byPriority = todos.value.reduce((acc, todo) => {
      acc[todo.priority] = (acc[todo.priority] || 0) + 1
      return acc
    }, {} as Record<Todo['priority'], number>)

    const byCategory = todos.value.reduce((acc, todo) => {
      const categoryId = todo.categoryId || 'uncategorized'
      acc[categoryId] = (acc[categoryId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const completedTodos = todos.value.filter(t => t.completed && t.completedAt)
    const averageCompletionTime = completedTodos.length > 0 
      ? completedTodos.reduce((acc, todo) => {
          const created = new Date(todo.createdAt).getTime()
          const completed = new Date(todo.completedAt!).getTime()
          return acc + (completed - created)
        }, 0) / completedTodos.length
      : 0

    return {
      total,
      completed,
      pending,
      overdue,
      byPriority,
      byCategory,
      completionRate,
      averageCompletionTime
    }
  })

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    todos.value.forEach(todo => {
      todo.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })

  // 操作方法
  async function fetchTodos() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/todos', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (!response.ok) {
        throw new Error('获取待办事项失败')
      }

      const data = await response.json()
      todos.value = data.map(todo => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt),
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
        completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined
      }))
      
      lastSync.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) {
    const optimisticTodo: Todo = {
      id: `temp-${Date.now()}`,
      ...todoData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 乐观更新
    todos.value.unshift(optimisticTodo)

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(todoData)
      })

      if (!response.ok) {
        throw new Error('创建待办事项失败')
      }

      const createdTodo = await response.json()
      
      // 用真实数据替换乐观更新的数据
      const index = todos.value.findIndex(t => t.id === optimisticTodo.id)
      if (index !== -1) {
        todos.value[index] = {
          ...createdTodo,
          createdAt: new Date(createdTodo.createdAt),
          updatedAt: new Date(createdTodo.updatedAt),
          dueDate: createdTodo.dueDate ? new Date(createdTodo.dueDate) : undefined
        }
      }

      return createdTodo
    } catch (err) {
      // 回滚乐观更新
      const index = todos.value.findIndex(t => t.id === optimisticTodo.id)
      if (index !== -1) {
        todos.value.splice(index, 1)
      }
      
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    const todoIndex = todos.value.findIndex(t => t.id === id)
    if (todoIndex === -1) return

    const originalTodo = { ...todos.value[todoIndex] }
    const updatedTodo = {
      ...originalTodo,
      ...updates,
      updatedAt: new Date(),
      completedAt: updates.completed && !originalTodo.completed ? new Date() : 
                   !updates.completed && originalTodo.completed ? undefined :
                   originalTodo.completedAt
    }

    // 乐观更新
    todos.value[todoIndex] = updatedTodo

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('更新待办事项失败')
      }

      const serverTodo = await response.json()
      todos.value[todoIndex] = {
        ...serverTodo,
        createdAt: new Date(serverTodo.createdAt),
        updatedAt: new Date(serverTodo.updatedAt),
        dueDate: serverTodo.dueDate ? new Date(serverTodo.dueDate) : undefined,
        completedAt: serverTodo.completedAt ? new Date(serverTodo.completedAt) : undefined
      }
    } catch (err) {
      // 回滚乐观更新
      todos.value[todoIndex] = originalTodo
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }

  async function deleteTodo(id: string) {
    const todoIndex = todos.value.findIndex(t => t.id === id)
    if (todoIndex === -1) return

    const deletedTodo = todos.value[todoIndex]
    
    // 乐观更新
    todos.value.splice(todoIndex, 1)
    selectedTodos.value.delete(id)

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (!response.ok) {
        throw new Error('删除待办事项失败')
      }
    } catch (err) {
      // 回滚乐观更新
      todos.value.splice(todoIndex, 0, deletedTodo)
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }

  async function bulkUpdateTodos(todoIds: string[], updates: Partial<Todo>) {
    const originalTodos = new Map()
    
    // 存储原始状态并应用乐观更新
    todoIds.forEach(id => {
      const todoIndex = todos.value.findIndex(t => t.id === id)
      if (todoIndex !== -1) {
        originalTodos.set(id, { ...todos.value[todoIndex] })
        todos.value[todoIndex] = {
          ...todos.value[todoIndex],
          ...updates,
          updatedAt: new Date()
        }
      }
    })

    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ ids: todoIds, updates })
      })

      if (!response.ok) {
        throw new Error('批量更新待办事项失败')
      }

      const updatedTodos = await response.json()
      
      // 用服务器响应更新
      updatedTodos.forEach(serverTodo => {
        const todoIndex = todos.value.findIndex(t => t.id === serverTodo.id)
        if (todoIndex !== -1) {
          todos.value[todoIndex] = {
            ...serverTodo,
            createdAt: new Date(serverTodo.createdAt),
            updatedAt: new Date(serverTodo.updatedAt),
            dueDate: serverTodo.dueDate ? new Date(serverTodo.dueDate) : undefined,
            completedAt: serverTodo.completedAt ? new Date(serverTodo.completedAt) : undefined
          }
        }
      })
    } catch (err) {
      // 回滚乐观更新
      originalTodos.forEach((originalTodo, id) => {
        const todoIndex = todos.value.findIndex(t => t.id === id)
        if (todoIndex !== -1) {
          todos.value[todoIndex] = originalTodo
        }
      })
      
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }

  function setFilter(newFilter: Partial<TodoFilter>) {
    filter.value = { ...filter.value, ...newFilter }
  }

  function clearFilter() {
    filter.value = {}
  }

  function toggleTodoSelection(id: string) {
    if (selectedTodos.value.has(id)) {
      selectedTodos.value.delete(id)
    } else {
      selectedTodos.value.add(id)
    }
  }

  function selectAllTodos() {
    filteredTodos.value.forEach(todo => {
      selectedTodos.value.add(todo.id)
    })
  }

  function clearSelection() {
    selectedTodos.value.clear()
  }

  function reorderTodos(fromIndex: number, toIndex: number) {
    const item = filteredTodos.value[fromIndex]
    const newTodos = [...todos.value]
    const originalIndex = newTodos.findIndex(t => t.id === item.id)
    
    if (originalIndex !== -1) {
      newTodos.splice(originalIndex, 1)
      newTodos.splice(toIndex, 0, item)
      todos.value = newTodos
    }
  }

  // 持久化
  function saveToLocalStorage() {
    try {
      localStorage.setItem('todos', JSON.stringify(todos.value))
      localStorage.setItem('todos-filter', JSON.stringify(filter.value))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const savedTodos = localStorage.getItem('todos')
      const savedFilter = localStorage.getItem('todos-filter')
      
      if (savedTodos) {
        todos.value = JSON.parse(savedTodos).map(todo => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          updatedAt: new Date(todo.updatedAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined
        }))
      }
      
      if (savedFilter) {
        filter.value = JSON.parse(savedFilter)
      }
    } catch (error) {
      console.error('从本地存储加载失败:', error)
    }
  }

  // 自动保存到本地存储
  watch(todos, saveToLocalStorage, { deep: true })
  watch(filter, saveToLocalStorage, { deep: true })

  return {
    // 状态
    todos: readonly(todos),
    filter: readonly(filter),
    loading: readonly(loading),
    error: readonly(error),
    lastSync: readonly(lastSync),
    selectedTodos: readonly(selectedTodos),
    
    // 计算属性
    filteredTodos,
    todosByCategory,
    overdueTodos,
    todayTodos,
    stats,
    allTags,
    
    // 操作方法
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    bulkUpdateTodos,
    setFilter,
    clearFilter,
    toggleTodoSelection,
    selectAllTodos,
    clearSelection,
    reorderTodos,
    loadFromLocalStorage
  }
})
```

### 分类存储

```typescript
// stores/categories.ts
export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const categoriesMap = computed(() => {
    return new Map(categories.value.map(cat => [cat.id, cat]))
  })

  async function fetchCategories() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('获取分类失败')
      }
      
      const data = await response.json()
      categories.value = data.map(cat => ({
        ...cat,
        createdAt: new Date(cat.createdAt)
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCategory(categoryData: Omit<Category, 'id' | 'createdAt'>) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      if (!response.ok) {
        throw new Error('创建分类失败')
      }

      const newCategory = await response.json()
      categories.value.push({
        ...newCategory,
        createdAt: new Date(newCategory.createdAt)
      })
      
      return newCategory
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }

  function getCategoryById(id: string): Category | undefined {
    return categoriesMap.value.get(id)
  }

  return {
    categories: readonly(categories),
    loading: readonly(loading),
    error: readonly(error),
    categoriesMap,
    fetchCategories,
    createCategory,
    getCategoryById
  }
})
```

## 组件使用

### 待办事项列表组件

```vue
<!-- components/TodoList.vue -->
<template>
  <div class="todo-list">
    <!-- 过滤器 -->
    <div class="filters">
      <input 
        v-model="searchQuery" 
        placeholder="搜索待办事项..."
        class="search-input"
      />
      
      <select v-model="selectedCategory">
        <option value="">所有分类</option>
        <option 
          v-for="category in categoriesStore.categories" 
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </select>
      
      <select v-model="completionFilter">
        <option value="">全部</option>
        <option value="pending">待完成</option>
        <option value="completed">已完成</option>
      </select>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat">
        <span class="label">总计:</span>
        <span class="value">{{ todosStore.stats.total }}</span>
      </div>
      <div class="stat">
        <span class="label">已完成:</span>
        <span class="value">{{ todosStore.stats.completed }}</span>
      </div>
      <div class="stat">
        <span class="label">完成率:</span>
        <span class="value">{{ todosStore.stats.completionRate.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="todosStore.selectedTodos.size > 0" class="bulk-actions">
      <button @click="markSelectedAsCompleted">
        标记 {{ todosStore.selectedTodos.size }} 项为已完成
      </button>
      <button @click="deleteSelected">
        删除选中项
      </button>
      <button @click="todosStore.clearSelection()">
        清除选择
      </button>
    </div>

    <!-- 待办事项 -->
    <div class="todo-items">
      <TransitionGroup name="todo" tag="div">
        <TodoItem
          v-for="todo in todosStore.filteredTodos"
          :key="todo.id"
          :todo="todo"
          :selected="todosStore.selectedTodos.has(todo.id)"
          @toggle-selection="todosStore.toggleTodoSelection(todo.id)"
          @update="handleUpdateTodo"
          @delete="handleDeleteTodo"
        />
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-if="todosStore.filteredTodos.length === 0" class="empty-state">
      <p>未找到待办事项</p>
      <button @click="showCreateForm = true">创建您的第一个待办事项</button>
    </div>

    <!-- 创建表单 -->
    <TodoCreateForm 
      v-if="showCreateForm"
      @create="handleCreateTodo"
      @cancel="showCreateForm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useTodosStore } from '@/stores/todos'
import { useCategoriesStore } from '@/stores/categories'
import TodoItem from './TodoItem.vue'
import TodoCreateForm from './TodoCreateForm.vue'

const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()

const showCreateForm = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const completionFilter = ref('')

// 当响应式值变化时更新过滤器
watch([searchQuery, selectedCategory, completionFilter], () => {
  todosStore.setFilter({
    search: searchQuery.value || undefined,
    categoryId: selectedCategory.value || undefined,
    completed: completionFilter.value === 'completed' ? true : 
               completionFilter.value === 'pending' ? false : undefined
  })
})

async function handleCreateTodo(todoData: any) {
  try {
    await todosStore.createTodo(todoData)
    showCreateForm.value = false
  } catch (error) {
    console.error('创建待办事项失败:', error)
  }
}

async function handleUpdateTodo(id: string, updates: any) {
  try {
    await todosStore.updateTodo(id, updates)
  } catch (error) {
    console.error('更新待办事项失败:', error)
  }
}

async function handleDeleteTodo(id: string) {
  try {
    await todosStore.deleteTodo(id)
  } catch (error) {
    console.error('删除待办事项失败:', error)
  }
}

async function markSelectedAsCompleted() {
  try {
    await todosStore.bulkUpdateTodos(
      Array.from(todosStore.selectedTodos),
      { completed: true }
    )
    todosStore.clearSelection()
  } catch (error) {
    console.error('标记待办事项为已完成失败:', error)
  }
}

async function deleteSelected() {
  if (confirm(`删除 ${todosStore.selectedTodos.size} 个待办事项？`)) {
    try {
      const promises = Array.from(todosStore.selectedTodos).map(id => 
        todosStore.deleteTodo(id)
      )
      await Promise.all(promises)
      todosStore.clearSelection()
    } catch (error) {
      console.error('删除待办事项失败:', error)
    }
  }
}

onMounted(async () => {
  todosStore.loadFromLocalStorage()
  await Promise.all([
    todosStore.fetchTodos(),
    categoriesStore.fetchCategories()
  ])
})
</script>
```

## 测试

```typescript
// tests/stores/todos.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodosStore } from '@/stores/todos'

// 模拟 fetch
global.fetch = vi.fn()

describe('待办事项存储', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该根据搜索查询过滤待办事项', () => {
    const store = useTodosStore()
    
    store.todos = [
      { id: '1', title: '买杂货', completed: false },
      { id: '2', title: '遛狗', completed: false },
      { id: '3', title: '买狗粮', completed: true }
    ]
    
    store.setFilter({ search: '狗' })
    
    expect(store.filteredTodos).toHaveLength(2)
    expect(store.filteredTodos.map(t => t.id)).toEqual(['2', '3'])
  })

  it('应该正确计算统计信息', () => {
    const store = useTodosStore()
    
    store.todos = [
      { id: '1', completed: false, priority: 'high' },
      { id: '2', completed: true, priority: 'medium' },
      { id: '3', completed: true, priority: 'high' }
    ]
    
    expect(store.stats.total).toBe(3)
    expect(store.stats.completed).toBe(2)
    expect(store.stats.pending).toBe(1)
    expect(store.stats.completionRate).toBe(66.67)
    expect(store.stats.byPriority.high).toBe(2)
    expect(store.stats.byPriority.medium).toBe(1)
  })

  it('应该处理乐观更新', async () => {
    const store = useTodosStore()
    
    const mockResponse = { id: 'real-id', title: '测试待办事项' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    
    const promise = store.createTodo({ title: '测试待办事项', completed: false })
    
    // 应该立即有乐观更新的待办事项
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].title).toBe('测试待办事项')
    expect(store.todos[0].id).toMatch(/^temp-/)
    
    await promise
    
    // 应该用真实待办事项替换
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].id).toBe('real-id')
  })

  it('应该在乐观更新失败时回滚', async () => {
    const store = useTodosStore()
    
    fetch.mockRejectedValueOnce(new Error('网络错误'))
    
    await expect(store.createTodo({ 
      title: '测试待办事项', 
      completed: false 
    })).rejects.toThrow('网络错误')
    
    // 应该回滚乐观更新
    expect(store.todos).toHaveLength(0)
  })
})
```

## 核心功能

### 1. 高级过滤
- 跨标题、描述和标签的文本搜索
- 按完成状态、优先级、分类过滤
- 截止日期范围过滤
- 多条件排序

### 2. 乐观更新
- 所有操作的即时 UI 反馈
- 失败时自动回滚
- 支持批量操作

### 3. 实时同步
- 与服务器的后台同步
- 冲突解决
- 本地存储的离线支持

### 4. 性能优化
- 派生状态的计算属性
- 高效的过滤和排序
- 大列表的虚拟滚动

### 5. 用户体验
- 拖拽排序
- 批量选择和操作
- 键盘快捷键
- 响应式设计

这个待办事项应用展示了如何使用 Pinia 构建复杂、功能丰富的应用，同时保持代码的清洁、可测试和高性能。