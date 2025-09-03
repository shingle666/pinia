---
title: Todo Store Example
description: A comprehensive todo list example demonstrating advanced Pinia features including nested state, complex actions, and real-world patterns.
head:
  - [meta, { name: description, content: "A comprehensive todo list example demonstrating advanced Pinia features including nested state, complex actions, and real-world patterns." }]
  - [meta, { name: keywords, content: "Pinia todo example, Vue state management, advanced store patterns" }]
---

# Todo Store Example

This example demonstrates more advanced Pinia concepts through a feature-rich todo list application. It covers complex state management, nested objects, filtering, persistence, and real-world patterns.

## Overview

The todo example showcases:

- Complex state structures with nested objects
- Advanced filtering and sorting
- Local storage persistence
- Optimistic updates
- Error handling
- Cross-store communication
- Performance optimizations

## Features

- ✅ Create, read, update, delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Filter by status (all, active, completed)
- ✅ Search functionality
- ✅ Categories and tags
- ✅ Due dates and priorities
- ✅ Bulk operations
- ✅ Local storage persistence
- ✅ Undo/redo functionality
- ✅ Statistics and analytics

## Types Definition

```ts
// types/todo.ts
export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  category: string
  tags: string[]
}

export interface TodoFilter {
  status: 'all' | 'active' | 'completed'
  category?: string
  priority?: Todo['priority']
  search?: string
  tags?: string[]
}

export interface TodoStats {
  total: number
  completed: number
  active: number
  overdue: number
  byCategory: Record<string, number>
  byPriority: Record<Todo['priority'], number>
}
```

## Store Definition

```ts
// stores/todos.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Todo, TodoFilter, TodoStats } from '../types/todo'

export const useTodosStore = defineStore('todos', () => {
  // State
  const todos = ref<Todo[]>([])
  const filter = ref<TodoFilter>({ status: 'all' })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const categories = ref<string[]>(['Personal', 'Work', 'Shopping', 'Health'])
  const history = ref<Todo[][]>([])
  const historyIndex = ref(-1)
  
  // Getters
  const filteredTodos = computed(() => {
    let result = todos.value
    
    // Filter by status
    if (filter.value.status === 'active') {
      result = result.filter(todo => !todo.completed)
    } else if (filter.value.status === 'completed') {
      result = result.filter(todo => todo.completed)
    }
    
    // Filter by category
    if (filter.value.category) {
      result = result.filter(todo => todo.category === filter.value.category)
    }
    
    // Filter by priority
    if (filter.value.priority) {
      result = result.filter(todo => todo.priority === filter.value.priority)
    }
    
    // Filter by search
    if (filter.value.search) {
      const search = filter.value.search.toLowerCase()
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(search) ||
        todo.description?.toLowerCase().includes(search)
      )
    }
    
    // Filter by tags
    if (filter.value.tags?.length) {
      result = result.filter(todo => 
        filter.value.tags!.some(tag => todo.tags.includes(tag))
      )
    }
    
    return result.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      
      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  })
  
  const activeTodos = computed(() => todos.value.filter(todo => !todo.completed))
  const completedTodos = computed(() => todos.value.filter(todo => todo.completed))
  
  const overdueTodos = computed(() => {
    const now = new Date()
    return todos.value.filter(todo => 
      !todo.completed && 
      todo.dueDate && 
      new Date(todo.dueDate) < now
    )
  })
  
  const stats = computed<TodoStats>(() => {
    const byCategory: Record<string, number> = {}
    const byPriority: Record<Todo['priority'], number> = {
      low: 0,
      medium: 0,
      high: 0
    }
    
    todos.value.forEach(todo => {
      byCategory[todo.category] = (byCategory[todo.category] || 0) + 1
      byPriority[todo.priority]++
    })
    
    return {
      total: todos.value.length,
      completed: completedTodos.value.length,
      active: activeTodos.value.length,
      overdue: overdueTodos.value.length,
      byCategory,
      byPriority
    }
  })
  
  const allTags = computed(() => {
    const tags = new Set<string>()
    todos.value.forEach(todo => {
      todo.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  })
  
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  
  // Actions
  const addTodo = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const todo: Todo = {
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...todoData
    }
    
    todos.value.push(todo)
    saveToHistory()
    persistTodos()
    
    return todo
  }
  
  const updateTodo = (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    const index = todos.value.findIndex(todo => todo.id === id)
    if (index === -1) return false
    
    todos.value[index] = {
      ...todos.value[index],
      ...updates,
      updatedAt: new Date()
    }
    
    saveToHistory()
    persistTodos()
    return true
  }
  
  const deleteTodo = (id: string) => {
    const index = todos.value.findIndex(todo => todo.id === id)
    if (index === -1) return false
    
    todos.value.splice(index, 1)
    saveToHistory()
    persistTodos()
    return true
  }
  
  const toggleTodo = (id: string) => {
    return updateTodo(id, { 
      completed: !todos.value.find(todo => todo.id === id)?.completed 
    })
  }
  
  const toggleAll = (completed: boolean) => {
    todos.value.forEach(todo => {
      todo.completed = completed
      todo.updatedAt = new Date()
    })
    
    saveToHistory()
    persistTodos()
  }
  
  const clearCompleted = () => {
    todos.value = todos.value.filter(todo => !todo.completed)
    saveToHistory()
    persistTodos()
  }
  
  const bulkUpdate = (ids: string[], updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    ids.forEach(id => {
      const index = todos.value.findIndex(todo => todo.id === id)
      if (index !== -1) {
        todos.value[index] = {
          ...todos.value[index],
          ...updates,
          updatedAt: new Date()
        }
      }
    })
    
    saveToHistory()
    persistTodos()
  }
  
  const setFilter = (newFilter: Partial<TodoFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }
  
  const clearFilter = () => {
    filter.value = { status: 'all' }
  }
  
  const addCategory = (category: string) => {
    if (!categories.value.includes(category)) {
      categories.value.push(category)
      persistCategories()
    }
  }
  
  const removeCategory = (category: string) => {
    const index = categories.value.indexOf(category)
    if (index !== -1) {
      categories.value.splice(index, 1)
      // Update todos that use this category
      todos.value.forEach(todo => {
        if (todo.category === category) {
          todo.category = 'Personal' // Default category
          todo.updatedAt = new Date()
        }
      })
      persistCategories()
      persistTodos()
    }
  }
  
  const saveToHistory = () => {
    // Remove any future history if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    // Add current state to history
    history.value.push(JSON.parse(JSON.stringify(todos.value)))
    historyIndex.value = history.value.length - 1
    
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }
  
  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--
      todos.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
      persistTodos()
    }
  }
  
  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++
      todos.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
      persistTodos()
    }
  }
  
  const loadTodos = () => {
    try {
      const saved = localStorage.getItem('todos')
      if (saved) {
        const parsed = JSON.parse(saved)
        todos.value = parsed.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          updatedAt: new Date(todo.updatedAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
        }))
        saveToHistory()
      }
    } catch (error) {
      console.error('Failed to load todos:', error)
    }
  }
  
  const loadCategories = () => {
    try {
      const saved = localStorage.getItem('todo-categories')
      if (saved) {
        categories.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }
  
  const persistTodos = () => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos.value))
    } catch (error) {
      console.error('Failed to persist todos:', error)
    }
  }
  
  const persistCategories = () => {
    try {
      localStorage.setItem('todo-categories', JSON.stringify(categories.value))
    } catch (error) {
      console.error('Failed to persist categories:', error)
    }
  }
  
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // Initialize
  loadTodos()
  loadCategories()
  
  return {
    // State
    todos: readonly(todos),
    filter: readonly(filter),
    loading: readonly(loading),
    error: readonly(error),
    categories: readonly(categories),
    
    // Getters
    filteredTodos,
    activeTodos,
    completedTodos,
    overdueTodos,
    stats,
    allTags,
    canUndo,
    canRedo,
    
    // Actions
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    toggleAll,
    clearCompleted,
    bulkUpdate,
    setFilter,
    clearFilter,
    addCategory,
    removeCategory,
    undo,
    redo
  }
})
```

## Component Usage

### Todo List Component

```vue
<!-- components/TodoList.vue -->
<template>
  <div class="todo-app">
    <header class="todo-header">
      <h1>Todo List</h1>
      <div class="stats">
        <span>{{ store.stats.active }} active</span>
        <span>{{ store.stats.completed }} completed</span>
        <span v-if="store.stats.overdue" class="overdue">
          {{ store.stats.overdue }} overdue
        </span>
      </div>
    </header>
    
    <TodoForm @add="handleAdd" />
    
    <TodoFilters 
      :filter="store.filter"
      :categories="store.categories"
      :tags="store.allTags"
      @update="store.setFilter"
      @clear="store.clearFilter"
    />
    
    <div class="todo-actions">
      <button 
        @click="store.toggleAll(true)"
        :disabled="store.activeTodos.length === 0"
      >
        Mark All Complete
      </button>
      
      <button 
        @click="store.clearCompleted()"
        :disabled="store.completedTodos.length === 0"
      >
        Clear Completed
      </button>
      
      <button @click="store.undo" :disabled="!store.canUndo">
        Undo
      </button>
      
      <button @click="store.redo" :disabled="!store.canRedo">
        Redo
      </button>
    </div>
    
    <div class="todo-list">
      <TodoItem
        v-for="todo in store.filteredTodos"
        :key="todo.id"
        :todo="todo"
        @update="handleUpdate"
        @delete="store.deleteTodo"
        @toggle="store.toggleTodo"
      />
      
      <div v-if="store.filteredTodos.length === 0" class="empty-state">
        <p v-if="store.todos.length === 0">
          No todos yet. Add one above!
        </p>
        <p v-else>
          No todos match the current filter.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTodosStore } from '../stores/todos'
import type { Todo } from '../types/todo'
import TodoForm from './TodoForm.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'

const store = useTodosStore()

const handleAdd = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
  store.addTodo(todoData)
}

const handleUpdate = (id: string, updates: Partial<Todo>) => {
  store.updateTodo(id, updates)
}
</script>
```

### Todo Form Component

```vue
<!-- components/TodoForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="todo-form">
    <div class="form-row">
      <input
        v-model="form.title"
        placeholder="What needs to be done?"
        required
        class="title-input"
      >
      
      <select v-model="form.priority" class="priority-select">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
    
    <div class="form-row">
      <textarea
        v-model="form.description"
        placeholder="Description (optional)"
        class="description-input"
      ></textarea>
    </div>
    
    <div class="form-row">
      <select v-model="form.category" class="category-select">
        <option v-for="category in store.categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      
      <input
        v-model="form.dueDate"
        type="datetime-local"
        class="date-input"
      >
    </div>
    
    <div class="form-row">
      <input
        v-model="tagInput"
        @keydown.enter.prevent="addTag"
        @keydown.comma.prevent="addTag"
        placeholder="Add tags (press Enter or comma)"
        class="tag-input"
      >
      
      <div class="tags">
        <span
          v-for="tag in form.tags"
          :key="tag"
          class="tag"
          @click="removeTag(tag)"
        >
          {{ tag }} ×
        </span>
      </div>
    </div>
    
    <button type="submit" class="submit-btn">
      Add Todo
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useTodosStore } from '../stores/todos'
import type { Todo } from '../types/todo'

const emit = defineEmits<{
  add: [todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>]
}>()

const store = useTodosStore()

const form = reactive({
  title: '',
  description: '',
  priority: 'medium' as Todo['priority'],
  category: store.categories[0],
  dueDate: '',
  tags: [] as string[]
})

const tagInput = ref('')

const handleSubmit = () => {
  const todoData = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    completed: false,
    priority: form.priority,
    category: form.category,
    dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
    tags: [...form.tags]
  }
  
  emit('add', todoData)
  
  // Reset form
  form.title = ''
  form.description = ''
  form.priority = 'medium'
  form.category = store.categories[0]
  form.dueDate = ''
  form.tags = []
}

const addTag = () => {
  const tag = tagInput.value.trim().replace(',', '')
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index !== -1) {
    form.tags.splice(index, 1)
  }
}
</script>
```

## Testing

```ts
// tests/todos.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodosStore } from '../stores/todos'

describe('Todos Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  
  it('adds a new todo', () => {
    const store = useTodosStore()
    
    const todo = store.addTodo({
      title: 'Test todo',
      completed: false,
      priority: 'medium',
      category: 'Personal',
      tags: []
    })
    
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toMatchObject({
      title: 'Test todo',
      completed: false,
      priority: 'medium'
    })
    expect(todo.id).toBeDefined()
  })
  
  it('toggles todo completion', () => {
    const store = useTodosStore()
    
    const todo = store.addTodo({
      title: 'Test todo',
      completed: false,
      priority: 'medium',
      category: 'Personal',
      tags: []
    })
    
    store.toggleTodo(todo.id)
    expect(store.todos[0].completed).toBe(true)
    
    store.toggleTodo(todo.id)
    expect(store.todos[0].completed).toBe(false)
  })
  
  it('filters todos correctly', () => {
    const store = useTodosStore()
    
    store.addTodo({
      title: 'Active todo',
      completed: false,
      priority: 'high',
      category: 'Work',
      tags: ['urgent']
    })
    
    store.addTodo({
      title: 'Completed todo',
      completed: true,
      priority: 'low',
      category: 'Personal',
      tags: ['done']
    })
    
    // Test status filter
    store.setFilter({ status: 'active' })
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('Active todo')
    
    store.setFilter({ status: 'completed' })
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('Completed todo')
    
    // Test category filter
    store.setFilter({ status: 'all', category: 'Work' })
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].category).toBe('Work')
  })
  
  it('calculates stats correctly', () => {
    const store = useTodosStore()
    
    store.addTodo({
      title: 'Todo 1',
      completed: false,
      priority: 'high',
      category: 'Work',
      tags: []
    })
    
    store.addTodo({
      title: 'Todo 2',
      completed: true,
      priority: 'medium',
      category: 'Personal',
      tags: []
    })
    
    expect(store.stats.total).toBe(2)
    expect(store.stats.active).toBe(1)
    expect(store.stats.completed).toBe(1)
    expect(store.stats.byCategory.Work).toBe(1)
    expect(store.stats.byCategory.Personal).toBe(1)
    expect(store.stats.byPriority.high).toBe(1)
    expect(store.stats.byPriority.medium).toBe(1)
  })
  
  it('supports undo/redo', () => {
    const store = useTodosStore()
    
    // Add a todo
    const todo = store.addTodo({
      title: 'Test todo',
      completed: false,
      priority: 'medium',
      category: 'Personal',
      tags: []
    })
    
    expect(store.todos).toHaveLength(1)
    expect(store.canUndo).toBe(true)
    
    // Undo
    store.undo()
    expect(store.todos).toHaveLength(0)
    expect(store.canRedo).toBe(true)
    
    // Redo
    store.redo()
    expect(store.todos).toHaveLength(1)
  })
})
```

## Key Concepts

### 1. Complex State Management
Managing nested objects and arrays with proper reactivity and immutability.

### 2. Advanced Filtering
Implementing multiple filter criteria with computed properties for optimal performance.

### 3. Persistence
Saving and loading state from localStorage with proper error handling.

### 4. History Management
Implementing undo/redo functionality with state snapshots.

### 5. Performance Optimization
Using computed properties and readonly state to minimize unnecessary re-renders.

## Best Practices

1. **Normalize complex state** for easier manipulation
2. **Use computed properties** for derived data
3. **Implement proper error handling** for persistence operations
4. **Keep actions focused** on single responsibilities
5. **Use TypeScript** for better type safety
6. **Test complex logic** thoroughly
7. **Optimize for performance** with readonly state and computed properties

## Related

- [State](../guide/state.md)
- [Getters](../guide/getters.md)
- [Actions](../guide/actions.md)
- [Plugins](../guide/plugins.md)
- [Testing](../guide/testing.md)