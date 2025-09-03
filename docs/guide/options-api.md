---
title: Using Pinia with Options API
description: Learn how to use Pinia stores with Vue's Options API, including mapState, mapActions, and other helper functions.
head:
  - [meta, { name: description, content: "Complete guide to using Pinia with Vue's Options API. Learn mapState, mapActions, mapWritableState, and mapStores helpers." }]
  - [meta, { name: keywords, content: "Pinia, Options API, Vue, mapState, mapActions, mapWritableState, mapStores" }]
  - [meta, { property: "og:title", content: "Using Pinia with Options API" }]
  - [meta, { property: "og:description", content: "Complete guide to using Pinia with Vue's Options API. Learn mapState, mapActions, mapWritableState, and mapStores helpers." }]
---

# Using Pinia with Options API

While Pinia is designed with the Composition API in mind, it also provides excellent support for the Options API through a set of helper functions. This guide covers how to use Pinia stores effectively within Vue's Options API.

## Overview

Pinia provides several helper functions to integrate stores with the Options API:

- `mapState()` - Map store state to computed properties
- `mapWritableState()` - Map store state to writable computed properties
- `mapActions()` - Map store actions to component methods
- `mapStores()` - Map entire stores to component properties

## Basic Store Setup

First, let's define a basic store:

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  },
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    setCount(value) {
      this.count = value
    }
  }
})
```

## Using mapState

The `mapState()` helper maps store state and getters to computed properties:

```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double Count: {{ doubleCount }}</p>
    <p>Is Even: {{ isEven }}</p>
    <p>Store Name: {{ name }}</p>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // Map state and getters
    ...mapState(useCounterStore, ['count', 'doubleCount', 'isEven', 'name'])
  }
}
</script>
```

### Custom Property Names

You can also map to custom property names:

```js
export default {
  computed: {
    ...mapState(useCounterStore, {
      myCount: 'count',
      myName: 'name',
      double: 'doubleCount'
    })
  }
}
```

## Using mapWritableState

For state that needs to be writable, use `mapWritableState()`:

```vue
<template>
  <div>
    <input v-model="count" type="number" />
    <input v-model="name" type="text" />
  </div>
</template>

<script>
import { mapWritableState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // These create writable computed properties
    ...mapWritableState(useCounterStore, ['count', 'name'])
  }
}
</script>
```

::: warning
`mapWritableState()` cannot be used with getters since they are read-only.
:::

## Using mapActions

The `mapActions()` helper maps store actions to component methods:

```vue
<template>
  <div>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="setCount(10)">Set to 10</button>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  methods: {
    ...mapActions(useCounterStore, ['increment', 'decrement', 'setCount'])
  }
}
</script>
```

### Custom Method Names

```js
export default {
  methods: {
    ...mapActions(useCounterStore, {
      add: 'increment',
      subtract: 'decrement',
      updateCount: 'setCount'
    })
  }
}
```

## Using mapStores

The `mapStores()` helper gives you access to entire stores:

```vue
<template>
  <div>
    <p>Count: {{ counterStore.count }}</p>
    <button @click="counterStore.increment()">Increment</button>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    ...mapStores(useCounterStore, useUserStore)
    // Creates counterStore and userStore properties
  }
}
</script>
```

## Combining Multiple Helpers

You can combine multiple helpers in the same component:

```vue
<template>
  <div>
    <!-- Read-only state -->
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    
    <!-- Writable state -->
    <input v-model="name" />
    
    <!-- Actions -->
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    
    <!-- Direct store access -->
    <button @click="counterStore.setCount(0)">Reset</button>
  </div>
</template>

<script>
import { mapState, mapWritableState, mapActions, mapStores } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount']),
    ...mapWritableState(useCounterStore, ['name']),
    ...mapStores(useCounterStore)
  },
  methods: {
    ...mapActions(useCounterStore, ['increment', 'decrement'])
  }
}
</script>
```

## Working with Multiple Stores

```vue
<script>
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    ...mapState(useUserStore, ['user', 'isLoggedIn']),
    ...mapState(useCartStore, ['items', 'total'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment']),
    ...mapActions(useUserStore, ['login', 'logout']),
    ...mapActions(useCartStore, ['addItem', 'removeItem'])
  }
}
</script>
```

## Advanced Patterns

### Conditional Mapping

You can conditionally map properties:

```js
export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    // Conditionally map user store
    ...(this.showUserInfo ? mapState(useUserStore, ['user']) : {})
  }
}
```

### Custom Computed Properties

Combine mapped state with custom computed properties:

```js
export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    
    // Custom computed property using mapped state
    countMessage() {
      return `Current count is ${this.count}`
    },
    
    // Computed property combining multiple stores
    summary() {
      return {
        count: this.count,
        user: this.user,
        timestamp: Date.now()
      }
    }
  }
}
```

### Method Composition

Combine mapped actions with custom methods:

```js
export default {
  methods: {
    ...mapActions(useCounterStore, ['increment', 'setCount']),
    
    // Custom method using mapped actions
    incrementBy(amount) {
      for (let i = 0; i < amount; i++) {
        this.increment()
      }
    },
    
    // Method with validation
    safeSetCount(value) {
      if (value >= 0 && value <= 100) {
        this.setCount(value)
      }
    }
  }
}
```

## TypeScript Support

Pinia's Options API helpers work well with TypeScript:

```ts
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default defineComponent({
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment', 'decrement'])
  }
})
```

## Best Practices

### 1. Organize Imports

```js
// Group Pinia imports together
import { mapState, mapWritableState, mapActions, mapStores } from 'pinia'

// Group store imports
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'
```

### 2. Use Descriptive Names

```js
export default {
  computed: {
    // Use descriptive names for clarity
    ...mapState(useCounterStore, {
      currentCount: 'count',
      counterName: 'name'
    })
  }
}
```

### 3. Group Related Mappings

```js
export default {
  computed: {
    // Counter store mappings
    ...mapState(useCounterStore, ['count', 'doubleCount']),
    
    // User store mappings
    ...mapState(useUserStore, ['user', 'isLoggedIn'])
  },
  methods: {
    // Counter actions
    ...mapActions(useCounterStore, ['increment', 'decrement']),
    
    // User actions
    ...mapActions(useUserStore, ['login', 'logout'])
  }
}
```

### 4. Avoid Overuse of mapStores

Use `mapStores` sparingly, prefer specific mappings:

```js
// Preferred: Specific mappings
export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    ...mapActions(useCounterStore, ['increment'])
  }
}

// Use mapStores only when you need full store access
export default {
  computed: {
    ...mapStores(useCounterStore)
  },
  methods: {
    complexOperation() {
      // When you need to call multiple store methods
      this.counterStore.increment()
      this.counterStore.setCount(this.counterStore.count * 2)
    }
  }
}
```

## Migration from Vuex

If you're migrating from Vuex, the mapping is straightforward:

```js
// Vuex
export default {
  computed: {
    ...mapState(['count']),
    ...mapGetters(['doubleCount'])
  },
  methods: {
    ...mapActions(['increment'])
  }
}

// Pinia
export default {
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment'])
  }
}
```

## Related Links

- [API Reference: mapState](../api/map-state.md)
- [API Reference: mapWritableState](../api/map-writable-state.md)
- [API Reference: mapActions](../api/map-actions.md)
- [API Reference: mapStores](../api/map-stores.md)
- [Composition API Guide](./composition-stores.md)
- [Migration from Vuex](./migration-from-vuex.md)