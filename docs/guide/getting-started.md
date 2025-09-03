---
title: Getting Started with Pinia | Quick Start Guide
description: Get up and running with Pinia quickly. Learn how to create stores, manage state, and use Pinia in your Vue.js applications with practical examples.
keywords: Pinia getting started, Vue state management tutorial, Pinia stores, Vue.js quick start, state management guide
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "article" }]
  - ["meta", { property: "og:title", content: "Getting Started with Pinia | Quick Start Guide" }]
  - ["meta", { property: "og:description", content: "Get up and running with Pinia quickly. Learn how to create stores, manage state, and use Pinia in your Vue.js applications with practical examples." }]
  - ["meta", { property: "og:url", content: "https://allfun.net/guide/getting-started" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "Getting Started with Pinia | Quick Start Guide" }]
  - ["meta", { property: "twitter:description", content: "Get up and running with Pinia quickly. Learn how to create stores, manage state, and use Pinia in your Vue.js applications with practical examples." }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/guide/getting-started" }]
---

# Getting Started

This guide will help you get up and running with Pinia quickly.in just a few minutes.

## Installation

First, install Pinia in your Vue.js project:

::: code-group

```bash [npm]
npm install pinia
```

```bash [yarn]
yarn add pinia
```

```bash [pnpm]
pnpm add pinia
```

:::

## Setup

### 1. Create the Pinia Instance

Create a Pinia instance and pass it to your Vue app:

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### 2. Create Your First Store

Create a new file for your store (e.g., `stores/counter.js`):

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => {
    return {
      count: 0,
      name: 'Eduardo'
    }
  },
  
  getters: {
    doubleCount: (state) => state.count * 2
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    reset() {
      this.count = 0
    }
  }
})
```

### 3. Use the Store in Components

Now you can use your store in any component:

```vue
<!-- components/Counter.vue -->
<template>
  <div>
    <h2>{{ store.name }}'s Counter</h2>
    <p>Count: {{ store.count }}</p>
    <p>Double Count: {{ store.doubleCount }}</p>
    
    <button @click="store.increment()">Increment</button>
    <button @click="store.reset()">Reset</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>
```

## Alternative Syntax: Composition API Style

You can also define stores using the Composition API syntax:

```js
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)
  const name = ref('Eduardo')
  
  // Getters
  const doubleCount = computed(() => count.value * 2)
  
  // Actions
  function increment() {
    count.value++
  }
  
  function reset() {
    count.value = 0
  }
  
  return {
    count,
    name,
    doubleCount,
    increment,
    reset
  }
})
```

## Using Stores

### Accessing State

```js
const store = useCounterStore()

// Access state directly
console.log(store.count) // 0

// Access getters
console.log(store.doubleCount) // 0
```

### Modifying State

```js
// Call actions
store.increment()

// Or modify state directly (not recommended for complex logic)
store.count++

// Patch multiple properties
store.$patch({
  count: store.count + 1,
  name: 'Abalam'
})

// Patch with a function
store.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
})
```

### Destructuring from Stores

When destructuring from a store, you need to use `storeToRefs()` to maintain reactivity:

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

// ❌ This won't be reactive
const { count, doubleCount } = store

// ✅ This will be reactive
const { count, doubleCount } = storeToRefs(store)

// ✅ Actions can be destructured directly
const { increment, reset } = store
</script>
```

## Project Structure

Here's a recommended project structure for organizing your stores:

```
src/
├── stores/
│   ├── index.js          # Export all stores
│   ├── counter.js        # Counter store
│   ├── user.js           # User store
│   └── products.js       # Products store
├── components/
├── views/
└── main.js
```

```js
// stores/index.js
export { useCounterStore } from './counter'
export { useUserStore } from './user'
export { useProductsStore } from './products'
```

## Next Steps

Now that you have Pinia set up, you can:

- Learn more about [defining stores](./defining-stores)
- Understand [state management](./state)
- Explore [getters](./getters) for computed values
- Master [actions](./actions) for state mutations

## Complete Example

Here's a complete working example:

::: details Click to see the full example

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

```js
// stores/todos.js
import { defineStore } from 'pinia'

export const useTodosStore = defineStore('todos', {
  state: () => ({
    todos: [],
    filter: 'all', // 'all', 'finished', 'unfinished'
    nextId: 0
  }),
  
  getters: {
    finishedTodos(state) {
      return state.todos.filter(todo => todo.isFinished)
    },
    
    unfinishedTodos(state) {
      return state.todos.filter(todo => !todo.isFinished)
    },
    
    filteredTodos(state) {
      if (state.filter === 'finished') {
        return this.finishedTodos
      } else if (state.filter === 'unfinished') {
        return this.unfinishedTodos
      }
      return state.todos
    }
  },
  
  actions: {
    addTodo(text) {
      this.todos.push({
        id: this.nextId++,
        text,
        isFinished: false
      })
    },
    
    toggleTodo(id) {
      const todo = this.todos.find(todo => todo.id === id)
      if (todo) {
        todo.isFinished = !todo.isFinished
      }
    },
    
    removeTodo(id) {
      const index = this.todos.findIndex(todo => todo.id === id)
      if (index > -1) {
        this.todos.splice(index, 1)
      }
    }
  }
})
```

```vue
<!-- App.vue -->
<template>
  <div>
    <h1>Todo App</h1>
    
    <form @submit.prevent="addTodo">
      <input v-model="newTodo" placeholder="Add a todo..." />
      <button type="submit">Add</button>
    </form>
    
    <div>
      <button 
        v-for="filter in ['all', 'finished', 'unfinished']"
        :key="filter"
        @click="todos.filter = filter"
        :class="{ active: todos.filter === filter }"
      >
        {{ filter }}
      </button>
    </div>
    
    <ul>
      <li 
        v-for="todo in todos.filteredTodos" 
        :key="todo.id"
        :class="{ finished: todo.isFinished }"
      >
        <input 
          type="checkbox" 
          v-model="todo.isFinished"
          @change="todos.toggleTodo(todo.id)"
        />
        {{ todo.text }}
        <button @click="todos.removeTodo(todo.id)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTodosStore } from './stores/todos'

const todos = useTodosStore()
const newTodo = ref('')

function addTodo() {
  if (newTodo.value.trim()) {
    todos.addTodo(newTodo.value)
    newTodo.value = ''
  }
}
</script>

<style>
.finished {
  text-decoration: line-through;
  opacity: 0.6;
}

.active {
  background-color: #42b883;
  color: white;
}
</style>
```

:::

Congratulations! You now have a working Pinia setup. Continue reading to learn more about the core concepts.