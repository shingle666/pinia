---
title: mapWritableState() - Pinia API
description: Complete API reference for mapWritableState function. Learn how to map writable store state properties in Options API components.
keywords: Pinia, Vue.js, mapWritableState, Options API, writable state mapping, API reference
author: Pinia Team
generator: VitePress
og:title: mapWritableState() - Pinia API
og:description: Complete API reference for mapWritableState function. Learn how to map writable store state properties in Options API components.
og:image: /og-image.svg
og:url: https://allfun.net/api/map-writable-state
twitter:card: summary_large_image
twitter:title: mapWritableState() - Pinia API
twitter:description: Complete API reference for mapWritableState function. Learn how to map writable store state properties in Options API components.
twitter:image: /og-image.svg
---

# mapWritableState()

Maps store state properties to writable computed properties in Options API components. Unlike `mapState()`, this allows direct mutation of state properties from the component.

## Signature

```ts
function mapWritableState<T>(
  useStore: () => T,
  keys: (keyof T)[] | Record<string, keyof T>
): WritableComputedOptions
```

## Parameters

- **useStore**: Store definition function
- **keys**: Array of state property names or object with custom mappings

## Returns

Writable computed properties object for Options API components.

## Basic Usage

### Array Syntax

```js
import { mapWritableState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // Maps this.count, this.name as writable computed properties
    ...mapWritableState(useCounterStore, ['count', 'name'])
  },
  
  methods: {
    increment() {
      this.count++ // Direct mutation
    },
    
    updateName(newName) {
      this.name = newName // Direct assignment
    }
  },
  
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <button @click="increment">+</button>
      
      <input v-model="name" placeholder="Enter name">
    </div>
  `
}
```

### Object Syntax

```js
import { mapWritableState } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    // Custom property names
    ...mapWritableState(useUserStore, {
      userName: 'name',
      userEmail: 'email',
      userAge: 'age'
    })
  },
  
  methods: {
    updateProfile(profile) {
      this.userName = profile.name
      this.userEmail = profile.email
      this.userAge = profile.age
    }
  },
  
  template: `
    <form @submit.prevent="saveProfile">
      <input v-model="userName" placeholder="Name">
      <input v-model="userEmail" placeholder="Email">
      <input v-model.number="userAge" placeholder="Age">
      <button type="submit">Save</button>
    </form>
  `
}
```

## Form Binding

### Two-Way Data Binding

```js
import { mapWritableState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapWritableState(useFormStore, [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address'
    ])
  },
  
  template: `
    <form>
      <div class="form-group">
        <label>First Name:</label>
        <input v-model="firstName" type="text">
      </div>
      
      <div class="form-group">
        <label>Last Name:</label>
        <input v-model="lastName" type="text">
      </div>
      
      <div class="form-group">
        <label>Email:</label>
        <input v-model="email" type="email">
      </div>
      
      <div class="form-group">
        <label>Phone:</label>
        <input v-model="phone" type="tel">
      </div>
      
      <div class="form-group">
        <label>Address:</label>
        <textarea v-model="address"></textarea>
      </div>
    </form>
  `
}
```

### Complex Form State

```js
import { mapWritableState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  computed: {
    ...mapWritableState(useSettingsStore, {
      darkMode: 'theme.dark',
      language: 'locale.language',
      notifications: 'preferences.notifications',
      autoSave: 'preferences.autoSave'
    })
  },
  
  template: `
    <div class="settings-panel">
      <div class="setting-item">
        <label>
          <input v-model="darkMode" type="checkbox">
          Dark Mode
        </label>
      </div>
      
      <div class="setting-item">
        <label>Language:</label>
        <select v-model="language">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>
      
      <div class="setting-item">
        <label>
          <input v-model="notifications" type="checkbox">
          Enable Notifications
        </label>
      </div>
      
      <div class="setting-item">
        <label>
          <input v-model="autoSave" type="checkbox">
          Auto Save
        </label>
      </div>
    </div>
  `
}
```

## Advanced Usage

### Nested State Properties

```js
import { mapWritableState } from 'pinia'
import { useProfileStore } from '@/stores/profile'

// Store definition
export const useProfileStore = defineStore('profile', {
  state: () => ({
    user: {
      personal: {
        name: '',
        email: '',
        avatar: ''
      },
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      }
    }
  })
})

// Component
export default {
  computed: {
    // Note: mapWritableState works best with flat state properties
    // For nested properties, consider using store actions or direct store access
    ...mapWritableState(useProfileStore, {
      // These would need to be flattened in the store or accessed differently
      userName: (store) => store.user.personal.name,
      userEmail: (store) => store.user.personal.email
    })
  },
  
  methods: {
    // Better approach for nested state
    updatePersonalInfo(info) {
      const store = useProfileStore()
      store.user.personal = { ...store.user.personal, ...info }
    }
  }
}
```

### Conditional Writable State

```js
import { mapWritableState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

export default {
  computed: {
    ...mapWritableState(useUserStore, ['name', 'email']),
    
    // Conditionally writable based on user permissions
    adminSettings: {
      get() {
        const userStore = useUserStore()
        if (userStore.isAdmin) {
          const adminStore = useAdminStore()
          return adminStore.settings
        }
        return null
      },
      set(value) {
        const userStore = useUserStore()
        if (userStore.isAdmin) {
          const adminStore = useAdminStore()
          adminStore.settings = value
        }
      }
    }
  }
}
```

### Array and Object State

```js
import { mapWritableState } from 'pinia'
import { useListStore } from '@/stores/list'

export default {
  computed: {
    ...mapWritableState(useListStore, ['items', 'filters'])
  },
  
  methods: {
    addItem(item) {
      this.items.push(item) // Direct array mutation
    },
    
    removeItem(index) {
      this.items.splice(index, 1) // Direct array mutation
    },
    
    updateFilter(key, value) {
      this.filters[key] = value // Direct object mutation
    },
    
    clearFilters() {
      this.filters = {} // Direct object replacement
    }
  },
  
  template: `
    <div>
      <div class="filters">
        <input 
          v-model="filters.search" 
          placeholder="Search..."
        >
        <select v-model="filters.category">
          <option value="">All Categories</option>
          <option value="tech">Technology</option>
          <option value="design">Design</option>
        </select>
      </div>
      
      <ul class="items">
        <li v-for="(item, index) in items" :key="item.id">
          {{ item.name }}
          <button @click="removeItem(index)">Remove</button>
        </li>
      </ul>
      
      <button @click="addItem({ id: Date.now(), name: 'New Item' })">
        Add Item
      </button>
    </div>
  `
}
```

## TypeScript

### Type Safety

```ts
import { mapWritableState } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import type { WritableComputedOptions } from 'vue'

interface ComponentComputed {
  count: number
  name: string
  isActive: boolean
}

export default defineComponent({
  computed: {
    ...mapWritableState(useCounterStore, [
      'count',
      'name', 
      'isActive'
    ])
  } as WritableComputedOptions<ComponentComputed>
})
```

### Generic Writable State Mapping

```ts
function createWritableStateMapper<
  T extends Record<string, any>,
  K extends keyof T
>(
  useStore: () => T,
  keys: K[]
): WritableComputedOptions<Pick<T, K>> {
  return mapWritableState(useStore, keys)
}

// Usage
const writableUserState = createWritableStateMapper(
  useUserStore, 
  ['name', 'email', 'age']
)

export default {
  computed: {
    ...writableUserState
  }
}
```

## Comparison with Other Mapping Functions

### vs mapState

```js
// mapState - read-only access
computed: {
  ...mapState(useCounterStore, ['count']),
  
  // This won't work - computed properties are read-only by default
  // this.count = 10 // Error!
}

// mapWritableState - read-write access
computed: {
  ...mapWritableState(useCounterStore, ['count']),
  
  // This works - writable computed properties
  // this.count = 10 // ✅ Works!
}
```

### vs Direct Store Access

```js
// Direct store access
export default {
  computed: {
    count: {
      get() {
        const store = useCounterStore()
        return store.count
      },
      set(value) {
        const store = useCounterStore()
        store.count = value
      }
    }
  }
}

// mapWritableState - equivalent but more concise
export default {
  computed: {
    ...mapWritableState(useCounterStore, ['count'])
  }
}
```

## Performance Considerations

### Selective Mapping

```js
// ✅ Good - only map what you need to modify
computed: {
  ...mapWritableState(useFormStore, [
    'firstName', // Will be modified
    'lastName',  // Will be modified
    'email'      // Will be modified
  ]),
  
  // Use mapState for read-only properties
  ...mapState(useFormStore, [
    'isValid',   // Read-only
    'errors',    // Read-only
    'submitting' // Read-only
  ])
}

// ❌ Less efficient - mapping everything as writable
computed: {
  ...mapWritableState(useFormStore, [
    'firstName', 'lastName', 'email',
    'isValid', 'errors', 'submitting' // These don't need to be writable
  ])
}
```

### Batch Updates

```js
import { mapWritableState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapWritableState(useFormStore, [
      'firstName',
      'lastName',
      'email'
    ])
  },
  
  methods: {
    // ✅ Good - batch updates
    updateProfile(profile) {
      // Use store action for batch updates
      const store = useFormStore()
      store.updateProfile(profile)
    },
    
    // ❌ Less efficient - individual updates
    updateProfileIndividually(profile) {
      this.firstName = profile.firstName // Triggers reactivity
      this.lastName = profile.lastName   // Triggers reactivity
      this.email = profile.email         // Triggers reactivity
    }
  }
}
```

## Common Patterns

### Form Validation

```js
import { mapWritableState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapWritableState(useFormStore, [
      'email',
      'password',
      'confirmPassword'
    ]),
    
    ...mapState(useFormStore, [
      'errors',
      'isValid'
    ])
  },
  
  watch: {
    email(newEmail) {
      // Validate email when it changes
      const store = useFormStore()
      store.validateEmail(newEmail)
    },
    
    password(newPassword) {
      // Validate password when it changes
      const store = useFormStore()
      store.validatePassword(newPassword)
    }
  },
  
  template: `
    <form>
      <div>
        <input 
          v-model="email" 
          type="email" 
          :class="{ error: errors.email }"
        >
        <span v-if="errors.email">{{ errors.email }}</span>
      </div>
      
      <div>
        <input 
          v-model="password" 
          type="password"
          :class="{ error: errors.password }"
        >
        <span v-if="errors.password">{{ errors.password }}</span>
      </div>
      
      <button :disabled="!isValid">Submit</button>
    </form>
  `
}
```

### Settings Panel

```js
import { mapWritableState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  computed: {
    ...mapWritableState(useSettingsStore, [
      'theme',
      'language',
      'notifications',
      'autoSave',
      'fontSize'
    ])
  },
  
  watch: {
    // Auto-save settings when they change
    theme() { this.saveSettings() },
    language() { this.saveSettings() },
    notifications() { this.saveSettings() },
    autoSave() { this.saveSettings() },
    fontSize() { this.saveSettings() }
  },
  
  methods: {
    saveSettings() {
      const store = useSettingsStore()
      store.saveToLocalStorage()
    },
    
    resetToDefaults() {
      const store = useSettingsStore()
      store.resetToDefaults()
    }
  }
}
```

### Shopping Cart

```js
import { mapWritableState } from 'pinia'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    ...mapWritableState(useCartStore, ['items']),
    
    ...mapState(useCartStore, [
      'total',
      'itemCount',
      'shipping'
    ])
  },
  
  methods: {
    updateQuantity(itemId, quantity) {
      const item = this.items.find(item => item.id === itemId)
      if (item) {
        item.quantity = quantity
      }
    },
    
    removeItem(itemId) {
      const index = this.items.findIndex(item => item.id === itemId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    }
  },
  
  template: `
    <div class="cart">
      <div v-for="item in items" :key="item.id" class="cart-item">
        <span>{{ item.name }}</span>
        <input 
          v-model.number="item.quantity" 
          type="number" 
          min="1"
          @change="updateQuantity(item.id, item.quantity)"
        >
        <button @click="removeItem(item.id)">Remove</button>
      </div>
      
      <div class="cart-summary">
        <p>Items: {{ itemCount }}</p>
        <p>Total: ${{ total }}</p>
      </div>
    </div>
  `
}
```

## Best Practices

### 1. Use for Form Fields and User Input

```js
// ✅ Good - perfect for form fields
computed: {
  ...mapWritableState(useFormStore, [
    'firstName',
    'lastName',
    'email',
    'phone'
  ])
}

// ❌ Avoid - computed values should use getters
computed: {
  ...mapWritableState(useUserStore, [
    'fullName' // This should be a getter, not writable state
  ])
}
```

### 2. Combine with Read-Only State

```js
// ✅ Good - mix writable and read-only as needed
computed: {
  // Writable state for user input
  ...mapWritableState(useFormStore, [
    'name',
    'email',
    'message'
  ]),
  
  // Read-only state for display
  ...mapState(useFormStore, [
    'isValid',
    'errors',
    'submitting'
  ])
}
```

### 3. Validate on Change

```js
computed: {
  ...mapWritableState(useFormStore, ['email'])
},

watch: {
  email: {
    handler(newEmail) {
      const store = useFormStore()
      store.validateField('email', newEmail)
    },
    immediate: true
  }
}
```

### 4. Handle Nested State Carefully

```js
// ✅ Good - use actions for complex nested updates
methods: {
  updateUserProfile(profile) {
    const store = useUserStore()
    store.updateProfile(profile) // Use store action
  }
}

// ❌ Avoid - complex nested mutations in component
computed: {
  userProfile: {
    get() {
      return this.userStore.user.profile
    },
    set(value) {
      // This can be error-prone and hard to track
      this.userStore.user.profile = value
    }
  }
}
```

## Migration from Vuex

### Vuex Two-Way Computed

```js
// Vuex
computed: {
  message: {
    get() {
      return this.$store.state.message
    },
    set(value) {
      this.$store.commit('updateMessage', value)
    }
  }
}

// Pinia with mapWritableState
computed: {
  ...mapWritableState(useMessageStore, ['message'])
}
```

### Vuex v-model with Store

```js
// Vuex - complex v-model setup
computed: {
  inputValue: {
    get() {
      return this.$store.state.form.inputValue
    },
    set(value) {
      this.$store.dispatch('updateInputValue', value)
    }
  }
}

// Pinia - simple v-model
computed: {
  ...mapWritableState(useFormStore, ['inputValue'])
}

// Template remains the same
// <input v-model="inputValue">
```

## See Also

- [mapState()](./map-state) - Map read-only store state
- [mapStores()](./map-stores) - Map entire stores
- [mapActions()](./map-actions) - Map store actions
- [Store Instance](./store-instance) - Store instance API
- [Options API Guide](../guide/options-api) - Using Pinia with Options API