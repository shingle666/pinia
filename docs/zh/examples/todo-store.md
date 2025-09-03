---
title: 待办事项 Store 示例
description: 一个全面的待办事项列表示例，演示 Pinia 的高级功能，包括嵌套状态、复杂操作和实际应用模式。
head:
  - [meta, { name: description, content: "一个全面的待办事项列表示例，演示 Pinia 的高级功能，包括嵌套状态、复杂操作和实际应用模式。" }]
  - [meta, { name: keywords, content: "Pinia 待办事项示例, Vue 状态管理, 高级 store 模式" }]
---

# 待办事项 Store 示例

这个示例通过一个功能丰富的待办事项列表应用演示了更高级的 Pinia 概念。它涵盖了复杂的状态管理、嵌套对象、过滤、持久化和实际应用模式。

## 概述

待办事项示例展示了：

- 具有嵌套对象的复杂状态结构
- 高级过滤和排序
- 本地存储持久化
- 乐观更新
- 错误处理
- 跨 store 通信
- 性能优化

## 功能特性

- ✅ 创建、读取、更新、删除待办事项
- ✅ 标记待办事项为完成/未完成
- ✅ 按状态过滤（全部、活跃、已完成）
- ✅ 搜索功能
- ✅ 分类和标签
- ✅ 截止日期和优先级
- ✅ 批量操作
- ✅ 本地存储持久化
- ✅ 撤销/重做功能
- ✅ 统计和分析

## 类型定义

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

## Store 定义

```ts
// stores/todos.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Todo, TodoFilter, TodoStats } from '../types/todo'

export const useTodosStore = defineStore('todos', () => {
  // 状态
  const todos = ref<Todo[]>([])
  const filter = ref<TodoFilter>({ status: 'all' })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const categories = ref<string[]>(['个人', '工作', '购物', '健康'])
  const history = ref<Todo[][]>([])
  const historyIndex = ref(-1)
  
  // 计算属性
  const filteredTodos = computed(() => {
    let result = todos.value
    
    // 按状态过滤
    if (filter.value.status === 'active') {
      result = result.filter(todo => !todo.completed)
    } else if (filter.value.status === 'completed') {
      result = result.filter(todo => todo.completed)
    }
    
    // 按分类过滤
    if (filter.value.category) {
      result = result.filter(todo => todo.category === filter.value.category)
    }
    
    // 按优先级过滤
    if (filter.value.priority) {
      result = result.filter(todo => todo.priority === filter.value.priority)
    }
    
    // 按搜索过滤
    if (filter.value.search) {
      const search = filter.value.search.toLowerCase()
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(search) ||
        todo.description?.toLowerCase().includes(search)
      )
    }
    
    // 按标签过滤
    if (filter.value.tags?.length) {
      result = result.filter(todo => 
        filter.value.tags!.some(tag => todo.tags.includes(tag))
      )
    }
    
    return result.sort((a, b) => {
      // 首先按优先级排序
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // 然后按截止日期
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      
      // 最后按创建日期
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
  
  // 操作
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
      // 更新使用此分类的待办事项
      todos.value.forEach(todo => {
        if (todo.category === category) {
          todo.category = '个人' // 默认分类
          todo.updatedAt = new Date()
        }
      })
      persistCategories()
      persistTodos()
    }
  }
  
  const saveToHistory = () => {
    // 如果不在末尾，移除任何未来的历史记录
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    // 将当前状态添加到历史记录
    history.value.push(JSON.parse(JSON.stringify(todos.value)))
    historyIndex.value = history.value.length - 1
    
    // 限制历史记录大小
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
      console.error('加载待办事项失败:', error)
    }
  }
  
  const loadCategories = () => {
    try {
      const saved = localStorage.getItem('todo-categories')
      if (saved) {
        categories.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }
  
  const persistTodos = () => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos.value))
    } catch (error) {
      console.error('持久化待办事项失败:', error)
    }
  }
  
  const persistCategories = () => {
    try {
      localStorage.setItem('todo-categories', JSON.stringify(categories.value))
    } catch (error) {
      console.error('持久化分类失败:', error)
    }
  }
  
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // 初始化
  loadTodos()
  loadCategories()
  
  return {
    // 状态
    todos: readonly(todos),
    filter: readonly(filter),
    loading: readonly(loading),
    error: readonly(error),
    categories: readonly(categories),
    
    // 计算属性
    filteredTodos,
    activeTodos,
    completedTodos,
    overdueTodos,
    stats,
    allTags,
    canUndo,
    canRedo,
    
    // 操作
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

## 组件使用

### 待办事项列表组件

```vue
<!-- components/TodoList.vue -->
<template>
  <div class="todo-app">
    <header class="todo-header">
      <h1>待办事项列表</h1>
      <div class="stats">
        <span>{{ store.stats.active }} 活跃</span>
        <span>{{ store.stats.completed }} 已完成</span>
        <span v-if="store.stats.overdue" class="overdue">
          {{ store.stats.overdue }} 已过期
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
        全部标记为完成
      </button>
      
      <button 
        @click="store.clearCompleted()"
        :disabled="store.completedTodos.length === 0"
      >
        清除已完成
      </button>
      
      <button @click="store.undo" :disabled="!store.canUndo">
        撤销
      </button>
      
      <button @click="store.redo" :disabled="!store.canRedo">
        重做
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
          还没有待办事项。在上面添加一个吧！
        </p>
        <p v-else>
          没有待办事项匹配当前过滤条件。
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

### 待办事项表单组件

```vue
<!-- components/TodoForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="todo-form">
    <div class="form-row">
      <input
        v-model="form.title"
        placeholder="需要做什么？"
        required
        class="title-input"
      >
      
      <select v-model="form.priority" class="priority-select">
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
    </div>
    
    <div class="form-row">
      <textarea
        v-model="form.description"
        placeholder="描述（可选）"
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
        placeholder="添加标签（按回车或逗号）"
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
      添加待办事项
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
  
  // 重置表单
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

## 测试

```ts
// tests/todos.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodosStore } from '../stores/todos'

describe('待办事项 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  
  it('添加新的待办事项', () => {
    const store = useTodosStore()
    
    const todo = store.addTodo({
      title: '测试待办事项',
      completed: false,
      priority: 'medium',
      category: '个人',
      tags: []
    })
    
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toMatchObject({
      title: '测试待办事项',
      completed: false,
      priority: 'medium'
    })
    expect(todo.id).toBeDefined()
  })
  
  it('切换待办事项完成状态', () => {
    const store = useTodosStore()
    
    const todo = store.addTodo({
      title: '测试待办事项',
      completed: false,
      priority: 'medium',
      category: '个人',
      tags: []
    })
    
    store.toggleTodo(todo.id)
    expect(store.todos[0].completed).toBe(true)
    
    store.toggleTodo(todo.id)
    expect(store.todos[0].completed).toBe(false)
  })
  
  it('正确过滤待办事项', () => {
    const store = useTodosStore()
    
    store.addTodo({
      title: '活跃待办事项',
      completed: false,
      priority: 'high',
      category: '工作',
      tags: ['紧急']
    })
    
    store.addTodo({
      title: '已完成待办事项',
      completed: true,
      priority: 'low',
      category: '个人',
      tags: ['完成']
    })
    
    // 测试状态过滤
    store.setFilter({ status: 'active' })
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('活跃待办事项')
    
    store.setFilter({ status: 'completed' })
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('已完成待办事项')
    
    // 测试分类过滤
    store.setFilter({ status: 'all', category: '工作' })
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].category).toBe('工作')
  })
  
  it('正确计算统计信息', () => {
    const store = useTodosStore()
    
    store.addTodo({
      title: '待办事项 1',
      completed: false,
      priority: 'high',
      category: '工作',
      tags: []
    })
    
    store.addTodo({
      title: '待办事项 2',
      completed: true,
      priority: 'medium',
      category: '个人',
      tags: []
    })
    
    expect(store.stats.total).toBe(2)
    expect(store.stats.active).toBe(1)
    expect(store.stats.completed).toBe(1)
    expect(store.stats.byCategory['工作']).toBe(1)
    expect(store.stats.byCategory['个人']).toBe(1)
    expect(store.stats.byPriority.high).toBe(1)
    expect(store.stats.byPriority.medium).toBe(1)
  })
  
  it('支持撤销/重做', () => {
    const store = useTodosStore()
    
    // 添加待办事项
    const todo = store.addTodo({
      title: '测试待办事项',
      completed: false,
      priority: 'medium',
      category: '个人',
      tags: []
    })
    
    expect(store.todos).toHaveLength(1)
    expect(store.canUndo).toBe(true)
    
    // 撤销
    store.undo()
    expect(store.todos).toHaveLength(0)
    expect(store.canRedo).toBe(true)
    
    // 重做
    store.redo()
    expect(store.todos).toHaveLength(1)
  })
})
```

## 核心概念

### 1. 复杂状态管理
使用适当的响应性和不可变性管理嵌套对象和数组。

### 2. 高级过滤
使用计算属性实现多个过滤条件以获得最佳性能。

### 3. 持久化
使用适当的错误处理从 localStorage 保存和加载状态。

### 4. 历史管理
使用状态快照实现撤销/重做功能。

### 5. 性能优化
使用计算属性和只读状态来最小化不必要的重新渲染。

## 最佳实践

1. **规范化复杂状态** 以便更容易操作
2. **使用计算属性** 处理派生数据
3. **为持久化操作实现适当的错误处理**
4. **保持操作专注** 于单一职责
5. **使用 TypeScript** 获得更好的类型安全
6. **彻底测试复杂逻辑**
7. **使用只读状态和计算属性优化性能**

## 相关链接

- [状态](../guide/state.md)
- [Getters](../guide/getters.md)
- [Actions](../guide/actions.md)
- [插件](../guide/plugins.md)
- [测试](../guide/testing.md)