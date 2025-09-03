---
title: Store Instance - Pinia API
description: Complete API reference for Pinia store instances. Learn about store properties, methods, and lifecycle hooks.
keywords: Pinia, Vue.js, store instance, API reference, store methods, store properties
author: Pinia Team
generator: VitePress
og:title: Store Instance - Pinia API
og:description: Complete API reference for Pinia store instances. Learn about store properties, methods, and lifecycle hooks.
og:image: /og-image.svg
og:url: https://allfun.net/api/store-instance
twitter:card: summary_large_image
twitter:title: Store Instance - Pinia API
twitter:description: Complete API reference for Pinia store instances. Learn about store properties, methods, and lifecycle hooks.
twitter:image: /og-image.svg
---

# Store Instance

A store instance is created when you call a store function (e.g., `useUserStore()`) within a component. This page documents all the properties and methods available on a store instance.

## Properties

### `$id`

- **Type:** `string`
- **Read only**

The unique identifier of the store as passed to `defineStore()`.

```js
const store = useUserStore()
console.log(store.$id) // 'user'
```

### `$state`

- **Type:** `UnwrapRef<S>`

The state of the store. You can directly access and mutate it.

```js
const store = useUserStore()
// Read state
console.log(store.$state.name)
// Mutate state
store.$state.name = 'New Name'
```

### `$getters`

- **Type:** `ComputedRef<G>`
- **Read only**

Object containing all getters. Mainly useful for devtools.

```js
const store = useUserStore()
console.log(store.$getters)
```

## Methods

### `$patch()`

Applies a patch to the store state. Can accept either a partial state object or a function that receives the current state.

#### Signature

```ts
$patch(partialState: Partial<S>): void
$patch(stateMutator: (state: S) => void): void
```

#### Examples

**Object patch:**

```js
store.$patch({
  name: 'New Name',
  age: 25
})
```

**Function patch:**

```js
store.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
})
```

### `$reset()`

**Only available in Option Stores**

Resets the store state to its initial value.

#### Signature

```ts
$reset(): void
```

#### Example

```js
const store = useUserStore()
store.$reset()
```

:::tip
For Setup Stores, you need to create your own `$reset()` function or use a plugin.
:::

### `$subscribe()`

Subscribes to state changes. Returns a function to remove the subscription.

#### Signature

```ts
$subscribe(
  callback: SubscriptionCallback<S>,
  options?: SubscriptionOptions
): () => void
```

#### Parameters

- **callback**: Function called on every state change
  - **mutation**: Object describing the mutation
  - **state**: New state after mutation
- **options**: Subscription options
  - **detached**: Keep subscription when component unmounts (default: `false`)
  - **deep**: Deep watch the state (default: `true`)
  - **flush**: Watch flush timing (default: `'pre'`)

#### Example

```js
const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('State changed:', mutation.type)
  console.log('New state:', state)
})

// Later, remove the subscription
unsubscribe()
```

#### Mutation Types

- `'direct'`: State was mutated directly (e.g., `store.name = 'new name'`)
- `'patch object'`: `$patch()` was called with an object
- `'patch function'`: `$patch()` was called with a function

### `$onAction()`

Subscribes to actions. Returns a function to remove the subscription.

#### Signature

```ts
$onAction(
  callback: ActionSubscriptionCallback,
  detached?: boolean
): () => void
```

#### Parameters

- **callback**: Function called before and after every action
  - **name**: Action name
  - **store**: Store instance
  - **args**: Arguments passed to the action
  - **after**: Hook called after action resolves
  - **onError**: Hook called if action throws or rejects
- **detached**: Keep subscription when component unmounts (default: `false`)

#### Example

```js
const unsubscribe = store.$onAction((
  {
    name, // name of the action
    store, // store instance
    args, // array of parameters passed to the action
    after, // hook after the action returns or resolves
    onError, // hook if the action throws or rejects
  }
) => {
  // A shared variable for this specific action call
  const startTime = Date.now()
  
  console.log(`Start "${name}" with params [${args.join(', ')}].`)

  // This will trigger after the action succeeds
  after((result) => {
    console.log(
      `Finished "${name}" after ${Date.now() - startTime}ms.\nResult: ${result}.`
    )
  })

  // This will trigger if the action throws or returns a rejected promise
  onError((error) => {
    console.warn(
      `Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`
    )
  })
})

// Remove the subscription
unsubscribe()
```

### `$dispose()`

Stops all subscriptions and removes the store from the Pinia instance. **Use with caution.**

#### Signature

```ts
$dispose(): void
```

#### Example

```js
const store = useUserStore()
store.$dispose()
```

:::warning
After calling `$dispose()`, the store instance should not be used anymore. This is mainly useful for testing or when you need to completely clean up a store.
:::

## TypeScript

### Store Type

You can get the type of a store instance using the `Store` utility type:

```ts
import type { Store } from 'pinia'
import { useUserStore } from './stores/user'

type UserStore = Store<
  'user', // store id
  UserState, // state
  UserGetters, // getters
  UserActions // actions
>

// Or infer from the store function
type UserStore = ReturnType<typeof useUserStore>
```

### State Type

Extract the state type from a store:

```ts
import type { StateTree } from 'pinia'
import { useUserStore } from './stores/user'

type UserState = StateTree & ReturnType<typeof useUserStore>['$state']
```

## Best Practices

### Subscription Management

```js
// ✅ Good: Automatic cleanup in components
export default {
  setup() {
    const store = useUserStore()
    
    // Automatically removed when component unmounts
    store.$subscribe((mutation, state) => {
      // Handle state changes
    })
  }
}

// ✅ Good: Manual cleanup when needed
export default {
  setup() {
    const store = useUserStore()
    
    const unsubscribe = store.$subscribe(
      (mutation, state) => {
        // Handle state changes
      },
      { detached: true } // Keep subscription after component unmounts
    )
    
    // Clean up manually when needed
    onBeforeUnmount(() => {
      unsubscribe()
    })
  }
}
```

### State Mutations

```js
// ✅ Good: Use $patch for multiple changes
store.$patch({
  name: 'New Name',
  email: 'new@email.com',
  age: 25
})

// ❌ Avoid: Multiple direct mutations
store.name = 'New Name'
store.email = 'new@email.com'
store.age = 25
```

### Action Monitoring

```js
// ✅ Good: Monitor actions for debugging
if (process.env.NODE_ENV === 'development') {
  store.$onAction(({ name, args, after, onError }) => {
    console.log(`Action ${name} called with:`, args)
    
    after((result) => {
      console.log(`Action ${name} resolved with:`, result)
    })
    
    onError((error) => {
      console.error(`Action ${name} failed:`, error)
    })
  })
}
```

## See Also

- [defineStore()](./define-store) - Creating stores
- [Pinia Instance](./pinia-instance) - Pinia instance API
- [Utilities](./utilities) - Utility functions