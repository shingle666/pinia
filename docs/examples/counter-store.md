---
title: Counter Store Example
description: A simple counter example demonstrating basic Pinia state management, actions, and getters.
head:
  - [meta, { name: description, content: "A simple counter example demonstrating basic Pinia state management, actions, and getters." }]
  - [meta, { name: keywords, content: "Pinia counter example, Vue state management, basic store" }]
---

# Counter Store Example

This example demonstrates the basics of Pinia with a simple counter store. It covers state definition, actions, getters, and component integration.

## Overview

The counter example is the "Hello World" of state management. It shows how to:

- Define a store with reactive state
- Create actions to modify state
- Use getters for computed values
- Integrate the store with Vue components
- Handle both Options API and Composition API usage

## Features

- ✅ Basic state management
- ✅ Increment/decrement actions
- ✅ Reset functionality
- ✅ Computed properties (getters)
- ✅ Component integration
- ✅ TypeScript support
- ✅ DevTools integration

## Store Definition

### Composition API Style

```ts
// stores/counter.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)
  const name = ref('Counter')
  
  // Getters
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  const isPositive = computed(() => count.value > 0)
  
  // Actions
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  const incrementBy = (amount: number) => {
    count.value += amount
  }
  
  const reset = () => {
    count.value = 0
  }
  
  const setName = (newName: string) => {
    name.value = newName
  }
  
  return {
    // State
    count: readonly(count),
    name: readonly(name),
    
    // Getters
    doubleCount,
    isEven,
    isPositive,
    
    // Actions
    increment,
    decrement,
    incrementBy,
    reset,
    setName
  }
})
```

### Options API Style

```ts
// stores/counter-options.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0,
    isPositive: (state) => state.count > 0
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    incrementBy(amount: number) {
      this.count += amount
    },
    
    reset() {
      this.count = 0
    },
    
    setName(newName: string) {
      this.name = newName
    }
  }
})
```

## Component Usage

### Composition API Component

```vue
<!-- components/CounterComposition.vue -->
<template>
  <div class="counter">
    <h2>{{ store.name }}</h2>
    
    <div class="counter-display">
      <span class="count">{{ store.count }}</span>
      <span class="double">Double: {{ store.doubleCount }}</span>
    </div>
    
    <div class="counter-info">
      <span :class="{ active: store.isEven }">Even</span>
      <span :class="{ active: store.isPositive }">Positive</span>
    </div>
    
    <div class="counter-controls">
      <button @click="store.decrement">-</button>
      <button @click="store.increment">+</button>
      <button @click="store.incrementBy(5)">+5</button>
      <button @click="store.reset">Reset</button>
    </div>
    
    <div class="name-input">
      <input 
        v-model="nameInput" 
        @keyup.enter="updateName"
        placeholder="Enter counter name"
      >
      <button @click="updateName">Update Name</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCounterStore } from '../stores/counter'

const store = useCounterStore()
const nameInput = ref('')

const updateName = () => {
  if (nameInput.value.trim()) {
    store.setName(nameInput.value.trim())
    nameInput.value = ''
  }
}
</script>

<style scoped>
.counter {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
}

.counter-display {
  margin: 1rem 0;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #3b82f6;
  display: block;
}

.double {
  font-size: 1.2rem;
  color: #6b7280;
  margin-top: 0.5rem;
  display: block;
}

.counter-info {
  margin: 1rem 0;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.counter-info span {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  transition: all 0.2s;
}

.counter-info span.active {
  background: #10b981;
  color: white;
}

.counter-controls {
  margin: 1rem 0;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.counter-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.counter-controls button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.name-input {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.name-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.name-input button {
  padding: 0.5rem 1rem;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
}
</style>
```

### Options API Component

```vue
<!-- components/CounterOptions.vue -->
<template>
  <div class="counter">
    <h2>{{ name }}</h2>
    
    <div class="counter-display">
      <span class="count">{{ count }}</span>
      <span class="double">Double: {{ doubleCount }}</span>
    </div>
    
    <div class="counter-info">
      <span :class="{ active: isEven }">Even</span>
      <span :class="{ active: isPositive }">Positive</span>
    </div>
    
    <div class="counter-controls">
      <button @click="decrement">-</button>
      <button @click="increment">+</button>
      <button @click="incrementBy(5)">+5</button>
      <button @click="reset">Reset</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '../stores/counter'

export default defineComponent({
  name: 'CounterOptions',
  
  computed: {
    ...mapState(useCounterStore, [
      'count',
      'name',
      'doubleCount',
      'isEven',
      'isPositive'
    ])
  },
  
  methods: {
    ...mapActions(useCounterStore, [
      'increment',
      'decrement',
      'incrementBy',
      'reset'
    ])
  }
})
</script>
```

## Advanced Usage

### With Watchers

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useCounterStore } from '../stores/counter'

const store = useCounterStore()

// Watch for count changes
watch(
  () => store.count,
  (newCount, oldCount) => {
    console.log(`Count changed from ${oldCount} to ${newCount}`)
    
    // Show notification for milestones
    if (newCount % 10 === 0 && newCount !== 0) {
      alert(`Milestone reached: ${newCount}!`)
    }
  }
)

// Watch for name changes
watch(
  () => store.name,
  (newName) => {
    document.title = `${newName} - Counter App`
  },
  { immediate: true }
)
</script>
```

### With Persistence

```ts
// stores/counter-persistent.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // Load initial state from localStorage
  const savedCount = localStorage.getItem('counter-count')
  const savedName = localStorage.getItem('counter-name')
  
  const count = ref(savedCount ? parseInt(savedCount) : 0)
  const name = ref(savedName || 'Counter')
  
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  const isPositive = computed(() => count.value > 0)
  
  const increment = () => {
    count.value++
    saveToStorage()
  }
  
  const decrement = () => {
    count.value--
    saveToStorage()
  }
  
  const incrementBy = (amount: number) => {
    count.value += amount
    saveToStorage()
  }
  
  const reset = () => {
    count.value = 0
    saveToStorage()
  }
  
  const setName = (newName: string) => {
    name.value = newName
    saveToStorage()
  }
  
  const saveToStorage = () => {
    localStorage.setItem('counter-count', count.value.toString())
    localStorage.setItem('counter-name', name.value)
  }
  
  return {
    count: readonly(count),
    name: readonly(name),
    doubleCount,
    isEven,
    isPositive,
    increment,
    decrement,
    incrementBy,
    reset,
    setName
  }
})
```

## Testing

### Unit Tests

```ts
// tests/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with default values', () => {
    const store = useCounterStore()
    
    expect(store.count).toBe(0)
    expect(store.name).toBe('Counter')
    expect(store.doubleCount).toBe(0)
    expect(store.isEven).toBe(true)
    expect(store.isPositive).toBe(false)
  })
  
  it('increments count', () => {
    const store = useCounterStore()
    
    store.increment()
    expect(store.count).toBe(1)
    expect(store.doubleCount).toBe(2)
    expect(store.isEven).toBe(false)
    expect(store.isPositive).toBe(true)
  })
  
  it('decrements count', () => {
    const store = useCounterStore()
    
    store.decrement()
    expect(store.count).toBe(-1)
    expect(store.doubleCount).toBe(-2)
    expect(store.isEven).toBe(false)
    expect(store.isPositive).toBe(false)
  })
  
  it('increments by amount', () => {
    const store = useCounterStore()
    
    store.incrementBy(5)
    expect(store.count).toBe(5)
    expect(store.doubleCount).toBe(10)
  })
  
  it('resets count', () => {
    const store = useCounterStore()
    
    store.incrementBy(10)
    store.reset()
    expect(store.count).toBe(0)
    expect(store.doubleCount).toBe(0)
  })
  
  it('updates name', () => {
    const store = useCounterStore()
    
    store.setName('My Counter')
    expect(store.name).toBe('My Counter')
  })
})
```

### Component Tests

```ts
// tests/CounterComponent.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CounterComposition from '../components/CounterComposition.vue'
import { useCounterStore } from '../stores/counter'

describe('CounterComposition', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('renders counter with initial state', () => {
    const wrapper = mount(CounterComposition)
    
    expect(wrapper.find('.count').text()).toBe('0')
    expect(wrapper.find('h2').text()).toBe('Counter')
    expect(wrapper.find('.double').text()).toBe('Double: 0')
  })
  
  it('increments when + button is clicked', async () => {
    const wrapper = mount(CounterComposition)
    const store = useCounterStore()
    
    await wrapper.find('button:nth-child(2)').trigger('click')
    
    expect(store.count).toBe(1)
    expect(wrapper.find('.count').text()).toBe('1')
  })
  
  it('decrements when - button is clicked', async () => {
    const wrapper = mount(CounterComposition)
    const store = useCounterStore()
    
    await wrapper.find('button:nth-child(1)').trigger('click')
    
    expect(store.count).toBe(-1)
    expect(wrapper.find('.count').text()).toBe('-1')
  })
  
  it('resets when reset button is clicked', async () => {
    const wrapper = mount(CounterComposition)
    const store = useCounterStore()
    
    // First increment
    store.incrementBy(5)
    await wrapper.vm.$nextTick()
    
    // Then reset
    await wrapper.find('button:nth-child(4)').trigger('click')
    
    expect(store.count).toBe(0)
    expect(wrapper.find('.count').text()).toBe('0')
  })
})
```

## Key Concepts

### 1. State Reactivity
Pinia automatically makes state reactive using Vue's reactivity system. Any changes to state will trigger component re-renders.

### 2. Getters as Computed Properties
Getters are cached computed properties that automatically update when their dependencies change.

### 3. Actions for State Mutations
Actions are methods that can modify state and can be synchronous or asynchronous.

### 4. Store Composition
Stores can be composed and reused across different components without prop drilling.

### 5. TypeScript Integration
Pinia provides excellent TypeScript support with automatic type inference.

## Best Practices

1. **Use descriptive names** for stores, state, and actions
2. **Keep actions simple** and focused on a single responsibility
3. **Use getters** for computed values instead of computing in components
4. **Prefer readonly state** exposure to prevent direct mutations
5. **Test your stores** independently from components
6. **Use TypeScript** for better development experience

## Related

- [Defining Stores](../guide/defining-stores.md)
- [State](../guide/state.md)
- [Getters](../guide/getters.md)
- [Actions](../guide/actions.md)
- [Testing](../guide/testing.md)