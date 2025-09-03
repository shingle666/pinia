# Todo List Application

A comprehensive todo list application demonstrating advanced Pinia patterns including nested state management, complex filtering, persistence, and real-time synchronization.

## Features

- ✅ Create, edit, and delete todos
- 🏷️ Categories and tags
- 📅 Due dates and priorities
- 🔍 Advanced filtering and search
- 💾 Local storage persistence
- 🔄 Real-time synchronization
- 📊 Statistics and analytics
- 🎨 Drag and drop reordering
- 📱 Responsive design

## Type Definitions

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

## Store Implementation

### Todo Store

```typescript
// stores/todos.ts
import { defineStore } from 'pinia'
import { useCategoriesStore } from './categories'
import { useAuthStore } from './auth'

export const useTodosStore = defineStore('todos', () => {
  const categoriesStore = useCategoriesStore()
  const authStore = useAuthStore()

  // State
  const todos = ref<Todo[]>([])
  const filter = ref<TodoFilter>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSync = ref<Date | null>(null)
  const selectedTodos = ref<Set<string>>(new Set())

  // Getters
  const filteredTodos = computed(() => {
    let result = [...todos.value]

    // Search filter
    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase()
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(searchLower) ||
        todo.description?.toLowerCase().includes(searchLower) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Completion filter
    if (filter.value.completed !== undefined) {
      result = result.filter(todo => todo.completed === filter.value.completed)
    }

    // Priority filter
    if (filter.value.priority?.length) {
      result = result.filter(todo => filter.value.priority!.includes(todo.priority))
    }

    // Category filter
    if (filter.value.categoryId) {
      result = result.filter(todo => todo.categoryId === filter.value.categoryId)
    }

    // Tags filter
    if (filter.value.tags?.length) {
      result = result.filter(todo => 
        filter.value.tags!.some(tag => todo.tags.includes(tag))
      )
    }

    // Due date filter
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

    // Sorting
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

  // Actions
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
        throw new Error('Failed to fetch todos')
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
      error.value = err instanceof Error ? err.message : 'Unknown error'
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

    // Optimistic update
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
        throw new Error('Failed to create todo')
      }

      const createdTodo = await response.json()
      
      // Replace optimistic todo with real one
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
      // Rollback optimistic update
      const index = todos.value.findIndex(t => t.id === optimisticTodo.id)
      if (index !== -1) {
        todos.value.splice(index, 1)
      }
      
      error.value = err instanceof Error ? err.message : 'Unknown error'
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

    // Optimistic update
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
        throw new Error('Failed to update todo')
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
      // Rollback optimistic update
      todos.value[todoIndex] = originalTodo
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  async function deleteTodo(id: string) {
    const todoIndex = todos.value.findIndex(t => t.id === id)
    if (todoIndex === -1) return

    const deletedTodo = todos.value[todoIndex]
    
    // Optimistic update
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
        throw new Error('Failed to delete todo')
      }
    } catch (err) {
      // Rollback optimistic update
      todos.value.splice(todoIndex, 0, deletedTodo)
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  async function bulkUpdateTodos(todoIds: string[], updates: Partial<Todo>) {
    const originalTodos = new Map()
    
    // Store original state and apply optimistic updates
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
        throw new Error('Failed to bulk update todos')
      }

      const updatedTodos = await response.json()
      
      // Update with server response
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
      // Rollback optimistic updates
      originalTodos.forEach((originalTodo, id) => {
        const todoIndex = todos.value.findIndex(t => t.id === id)
        if (todoIndex !== -1) {
          todos.value[todoIndex] = originalTodo
        }
      })
      
      error.value = err instanceof Error ? err.message : 'Unknown error'
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

  // Persistence
  function saveToLocalStorage() {
    try {
      localStorage.setItem('todos', JSON.stringify(todos.value))
      localStorage.setItem('todos-filter', JSON.stringify(filter.value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
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
      console.error('Failed to load from localStorage:', error)
    }
  }

  // Auto-save to localStorage
  watch(todos, saveToLocalStorage, { deep: true })
  watch(filter, saveToLocalStorage, { deep: true })

  return {
    // State
    todos: readonly(todos),
    filter: readonly(filter),
    loading: readonly(loading),
    error: readonly(error),
    lastSync: readonly(lastSync),
    selectedTodos: readonly(selectedTodos),
    
    // Getters
    filteredTodos,
    todosByCategory,
    overdueTodos,
    todayTodos,
    stats,
    allTags,
    
    // Actions
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

### Categories Store

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
        throw new Error('Failed to fetch categories')
      }
      
      const data = await response.json()
      categories.value = data.map(cat => ({
        ...cat,
        createdAt: new Date(cat.createdAt)
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
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
        throw new Error('Failed to create category')
      }

      const newCategory = await response.json()
      categories.value.push({
        ...newCategory,
        createdAt: new Date(newCategory.createdAt)
      })
      
      return newCategory
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
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

## Component Usage

### Todo List Component

```vue
<!-- components/TodoList.vue -->
<template>
  <div class="todo-list">
    <!-- Filters -->
    <div class="filters">
      <input 
        v-model="searchQuery" 
        placeholder="Search todos..."
        class="search-input"
      />
      
      <select v-model="selectedCategory">
        <option value="">All Categories</option>
        <option 
          v-for="category in categoriesStore.categories" 
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </select>
      
      <select v-model="completionFilter">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
    </div>

    <!-- Stats -->
    <div class="stats">
      <div class="stat">
        <span class="label">Total:</span>
        <span class="value">{{ todosStore.stats.total }}</span>
      </div>
      <div class="stat">
        <span class="label">Completed:</span>
        <span class="value">{{ todosStore.stats.completed }}</span>
      </div>
      <div class="stat">
        <span class="label">Completion Rate:</span>
        <span class="value">{{ todosStore.stats.completionRate.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="todosStore.selectedTodos.size > 0" class="bulk-actions">
      <button @click="markSelectedAsCompleted">
        Mark {{ todosStore.selectedTodos.size }} as Completed
      </button>
      <button @click="deleteSelected">
        Delete Selected
      </button>
      <button @click="todosStore.clearSelection()">
        Clear Selection
      </button>
    </div>

    <!-- Todo Items -->
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

    <!-- Empty State -->
    <div v-if="todosStore.filteredTodos.length === 0" class="empty-state">
      <p>No todos found</p>
      <button @click="showCreateForm = true">Create your first todo</button>
    </div>

    <!-- Create Form -->
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

// Update filters when reactive values change
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
    console.error('Failed to create todo:', error)
  }
}

async function handleUpdateTodo(id: string, updates: any) {
  try {
    await todosStore.updateTodo(id, updates)
  } catch (error) {
    console.error('Failed to update todo:', error)
  }
}

async function handleDeleteTodo(id: string) {
  try {
    await todosStore.deleteTodo(id)
  } catch (error) {
    console.error('Failed to delete todo:', error)
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
    console.error('Failed to mark todos as completed:', error)
  }
}

async function deleteSelected() {
  if (confirm(`Delete ${todosStore.selectedTodos.size} todos?`)) {
    try {
      const promises = Array.from(todosStore.selectedTodos).map(id => 
        todosStore.deleteTodo(id)
      )
      await Promise.all(promises)
      todosStore.clearSelection()
    } catch (error) {
      console.error('Failed to delete todos:', error)
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

## Testing

```typescript
// tests/stores/todos.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodosStore } from '@/stores/todos'

// Mock fetch
global.fetch = vi.fn()

describe('Todos Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should filter todos by search query', () => {
    const store = useTodosStore()
    
    store.todos = [
      { id: '1', title: 'Buy groceries', completed: false },
      { id: '2', title: 'Walk the dog', completed: false },
      { id: '3', title: 'Buy dog food', completed: true }
    ]
    
    store.setFilter({ search: 'dog' })
    
    expect(store.filteredTodos).toHaveLength(2)
    expect(store.filteredTodos.map(t => t.id)).toEqual(['2', '3'])
  })

  it('should calculate stats correctly', () => {
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

  it('should handle optimistic updates', async () => {
    const store = useTodosStore()
    
    const mockResponse = { id: 'real-id', title: 'Test Todo' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    
    const promise = store.createTodo({ title: 'Test Todo', completed: false })
    
    // Should have optimistic todo immediately
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].title).toBe('Test Todo')
    expect(store.todos[0].id).toMatch(/^temp-/)
    
    await promise
    
    // Should replace with real todo
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].id).toBe('real-id')
  })

  it('should rollback on failed optimistic update', async () => {
    const store = useTodosStore()
    
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    await expect(store.createTodo({ 
      title: 'Test Todo', 
      completed: false 
    })).rejects.toThrow('Network error')
    
    // Should rollback optimistic update
    expect(store.todos).toHaveLength(0)
  })
})
```

## Key Features

### 1. Advanced Filtering
- Text search across title, description, and tags
- Filter by completion status, priority, category
- Date range filtering for due dates
- Sorting by multiple criteria

### 2. Optimistic Updates
- Immediate UI feedback for all operations
- Automatic rollback on failures
- Bulk operations support

### 3. Real-time Synchronization
- Background sync with server
- Conflict resolution
- Offline support with local storage

### 4. Performance Optimizations
- Computed properties for derived state
- Efficient filtering and sorting
- Virtual scrolling for large lists

### 5. User Experience
- Drag and drop reordering
- Bulk selection and operations
- Keyboard shortcuts
- Responsive design

This todo list application demonstrates how to build complex, feature-rich applications with Pinia while maintaining clean, testable, and performant code.