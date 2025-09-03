---
title: Plugins
description: Discover official and community Pinia plugins to extend your store functionality.
head:
  - [meta, { name: description, content: "Discover official and community Pinia plugins to extend your store functionality." }]
  - [meta, { name: keywords, content: "Pinia plugins, Vue plugins, state management plugins, Pinia ecosystem" }]
  - [meta, { property: "og:title", content: "Plugins - Pinia" }]
  - [meta, { property: "og:description", content: "Discover official and community Pinia plugins to extend your store functionality." }]
---

# Plugins

Pinia's plugin system allows you to extend store functionality with reusable features. Here's a comprehensive list of official and community plugins.

## Official Plugins

### Pinia Plugin Persistedstate

**Persist your Pinia stores across browser sessions.**

- **Repository**: [prazdevs/pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)
- **NPM**: `pinia-plugin-persistedstate`
- **Features**:
  - Multiple storage options (localStorage, sessionStorage, custom)
  - Selective state persistence
  - Encryption support
  - SSR compatibility
  - TypeScript support

```bash
npm install pinia-plugin-persistedstate
```

```js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

```js
// Usage in store
export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: ''
  }),
  persist: true
})
```

### Pinia ORM

**Object-Relational Mapping for Pinia stores.**

- **Repository**: [CodeDredd/pinia-orm](https://github.com/CodeDredd/pinia-orm)
- **NPM**: `@pinia-orm/core`
- **Features**:
  - Model definitions
  - Relationships (hasOne, hasMany, belongsTo)
  - Query builder
  - Data normalization
  - TypeScript support

```bash
npm install @pinia-orm/core
```

```js
import { Model } from '@pinia-orm/core'

class User extends Model {
  static entity = 'users'
  
  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
      posts: this.hasMany(Post, 'user_id')
    }
  }
}
```

## Development Tools

### Pinia DevTools

**Enhanced debugging experience for Pinia stores.**

- **Built-in**: Available in Vue DevTools
- **Features**:
  - Time-travel debugging
  - State inspection
  - Action tracking
  - Store relationships
  - Performance monitoring

### Pinia Logger

**Comprehensive logging for store actions and mutations.**

- **Repository**: [wobsoriano/pinia-logger](https://github.com/wobsoriano/pinia-logger)
- **NPM**: `pinia-logger`
- **Features**:
  - Action logging
  - State diff visualization
  - Customizable log levels
  - Performance metrics

```bash
npm install pinia-logger
```

```js
import { PiniaLogger } from 'pinia-logger'

pinia.use(PiniaLogger({
  expanded: true,
  disabled: process.env.NODE_ENV === 'production'
}))
```

## State Management

### Pinia Shared State

**Share state between multiple Pinia instances.**

- **Repository**: [wobsoriano/pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state)
- **NPM**: `pinia-shared-state`
- **Features**:
  - Cross-instance synchronization
  - Selective sharing
  - Event-based updates
  - TypeScript support

```bash
npm install pinia-shared-state
```

```js
import { PiniaSharedState } from 'pinia-shared-state'

pinia.use(PiniaSharedState({
  enable: true,
  initialize: true,
  type: 'localstorage'
}))
```

### Pinia Undo

**Add undo/redo functionality to your stores.**

- **Repository**: [wobsoriano/pinia-undo](https://github.com/wobsoriano/pinia-undo)
- **NPM**: `pinia-undo`
- **Features**:
  - Undo/redo operations
  - History management
  - Selective tracking
  - Custom serialization

```bash
npm install pinia-undo
```

```js
import { PiniaUndo } from 'pinia-undo'

pinia.use(PiniaUndo)

// In your store
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    }
  },
  undo: {
    enable: true,
    limit: 10
  }
})
```

## Validation

### Pinia Yup

**Schema validation using Yup.**

- **Repository**: [wobsoriano/pinia-yup](https://github.com/wobsoriano/pinia-yup)
- **NPM**: `pinia-yup`
- **Features**:
  - Schema-based validation
  - Async validation
  - Error handling
  - TypeScript integration

```bash
npm install pinia-yup yup
```

```js
import * as yup from 'yup'
import { PiniaYup } from 'pinia-yup'

pinia.use(PiniaYup)

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: ''
  }),
  schema: yup.object({
    name: yup.string().required(),
    email: yup.string().email().required()
  })
})
```

### Pinia Zod

**Schema validation using Zod.**

- **Repository**: [wobsoriano/pinia-zod](https://github.com/wobsoriano/pinia-zod)
- **NPM**: `pinia-zod`
- **Features**:
  - Type-safe validation
  - Runtime type checking
  - Error messages
  - Schema inference

```bash
npm install pinia-zod zod
```

```js
import { z } from 'zod'
import { PiniaZod } from 'pinia-zod'

pinia.use(PiniaZod)

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: ''
  }),
  schema: UserSchema
})
```

## Testing

### Pinia Testing

**Testing utilities for Pinia stores.**

- **Repository**: [posva/pinia-testing](https://github.com/posva/pinia-testing)
- **NPM**: `@pinia/testing`
- **Features**:
  - Store mocking
  - Action spying
  - State snapshots
  - Test helpers

```bash
npm install @pinia/testing
```

```js
import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'

const wrapper = mount(Component, {
  global: {
    plugins: [createTestingPinia({
      createSpy: vi.fn
    })]
  }
})
```

## Network & API

### Pinia API

**RESTful API integration for Pinia.**

- **Repository**: [wobsoriano/pinia-api](https://github.com/wobsoriano/pinia-api)
- **NPM**: `pinia-api`
- **Features**:
  - Automatic CRUD operations
  - Request caching
  - Loading states
  - Error handling

```bash
npm install pinia-api
```

```js
import { PiniaAPI } from 'pinia-api'

pinia.use(PiniaAPI({
  baseURL: 'https://api.example.com'
}))

export const useUsersStore = defineStore('users', {
  api: {
    endpoints: {
      getUsers: '/users',
      getUser: '/users/:id',
      createUser: 'POST /users',
      updateUser: 'PUT /users/:id',
      deleteUser: 'DELETE /users/:id'
    }
  }
})
```

### Pinia GraphQL

**GraphQL integration for Pinia stores.**

- **Repository**: [wobsoriano/pinia-graphql](https://github.com/wobsoriano/pinia-graphql)
- **NPM**: `pinia-graphql`
- **Features**:
  - Query and mutation support
  - Subscription handling
  - Cache management
  - TypeScript codegen

```bash
npm install pinia-graphql
```

```js
import { PiniaGraphQL } from 'pinia-graphql'

pinia.use(PiniaGraphQL({
  client: apolloClient
}))

export const useUsersStore = defineStore('users', {
  graphql: {
    queries: {
      getUsers: gql`
        query GetUsers {
          users {
            id
            name
            email
          }
        }
      `
    }
  }
})
```

## Performance

### Pinia Debounce

**Debounce store actions and state changes.**

- **Repository**: [wobsoriano/pinia-debounce](https://github.com/wobsoriano/pinia-debounce)
- **NPM**: `pinia-debounce`
- **Features**:
  - Action debouncing
  - State change debouncing
  - Configurable delays
  - Cancellation support

```bash
npm install pinia-debounce
```

```js
import { PiniaDebounce } from 'pinia-debounce'

pinia.use(PiniaDebounce)

export const useSearchStore = defineStore('search', {
  state: () => ({ query: '' }),
  actions: {
    search() {
      // This will be debounced
      console.log('Searching for:', this.query)
    }
  },
  debounce: {
    search: 300
  }
})
```

### Pinia Cache

**Advanced caching for store data.**

- **Repository**: [wobsoriano/pinia-cache](https://github.com/wobsoriano/pinia-cache)
- **NPM**: `pinia-cache`
- **Features**:
  - TTL-based caching
  - LRU eviction
  - Memory management
  - Cache invalidation

```bash
npm install pinia-cache
```

```js
import { PiniaCache } from 'pinia-cache'

pinia.use(PiniaCache({
  ttl: 60000, // 1 minute
  max: 100    // Maximum cache entries
}))
```

## UI Integration

### Pinia Form

**Form state management with validation.**

- **Repository**: [wobsoriano/pinia-form](https://github.com/wobsoriano/pinia-form)
- **NPM**: `pinia-form`
- **Features**:
  - Form state tracking
  - Validation integration
  - Dirty state detection
  - Reset functionality

```bash
npm install pinia-form
```

```js
import { PiniaForm } from 'pinia-form'

pinia.use(PiniaForm)

export const useContactForm = defineStore('contactForm', {
  form: {
    fields: {
      name: { value: '', required: true },
      email: { value: '', required: true, type: 'email' },
      message: { value: '', required: true }
    }
  }
})
```

### Pinia Router

**Router integration for Pinia stores.**

- **Repository**: [wobsoriano/pinia-router](https://github.com/wobsoriano/pinia-router)
- **NPM**: `pinia-router`
- **Features**:
  - Route-based store activation
  - Navigation guards
  - Query parameter binding
  - History management

```bash
npm install pinia-router
```

```js
import { PiniaRouter } from 'pinia-router'

pinia.use(PiniaRouter(router))

export const usePageStore = defineStore('page', {
  router: {
    routes: ['/dashboard', '/profile'],
    queryParams: ['tab', 'filter']
  }
})
```

## Mobile & Native

### Pinia React Native

**React Native integration for Pinia.**

- **Repository**: [wobsoriano/pinia-react-native](https://github.com/wobsoriano/pinia-react-native)
- **NPM**: `pinia-react-native`
- **Features**:
  - AsyncStorage persistence
  - Native module integration
  - Performance optimization
  - Platform-specific features

```bash
npm install pinia-react-native
```

### Pinia Capacitor

**Capacitor integration for hybrid apps.**

- **Repository**: [wobsoriano/pinia-capacitor](https://github.com/wobsoriano/pinia-capacitor)
- **NPM**: `pinia-capacitor`
- **Features**:
  - Native storage
  - Device API integration
  - Offline support
  - Platform detection

```bash
npm install pinia-capacitor
```

## Community Plugins

### Pinia Class

**Class-based store definitions.**

- **Repository**: [wobsoriano/pinia-class](https://github.com/wobsoriano/pinia-class)
- **NPM**: `pinia-class`
- **Features**:
  - Decorator support
  - Inheritance
  - Method binding
  - TypeScript integration

```bash
npm install pinia-class
```

```js
import { Store, State, Action } from 'pinia-class'

@Store('counter')
class CounterStore {
  @State count = 0
  
  @Action
  increment() {
    this.count++
  }
}
```

### Pinia Colada

**Data fetching and caching solution.**

- **Repository**: [posva/pinia-colada](https://github.com/posva/pinia-colada)
- **NPM**: `@pinia/colada`
- **Features**:
  - Smart caching
  - Background updates
  - Optimistic updates
  - Error boundaries

```bash
npm install @pinia/colada
```

```js
import { useQuery } from '@pinia/colada'

export function useUser(id) {
  return useQuery({
    key: ['user', id],
    query: () => fetchUser(id)
  })
}
```

## Plugin Development

### Creating Your Own Plugin

Want to create your own plugin? Check out our comprehensive guides:

- [Plugin Development Guide](../cookbook/plugin-development.md)
- [Plugin API Reference](../api/plugins.md)
- [TypeScript Plugin Development](../cookbook/typescript-best-practices.md)

### Plugin Template

Use our official plugin template to get started quickly:

```bash
npx create-pinia-plugin my-awesome-plugin
```

### Publishing Guidelines

1. **Naming Convention**: Use `pinia-` prefix for npm packages
2. **Documentation**: Include comprehensive README and examples
3. **TypeScript**: Provide type definitions
4. **Testing**: Include unit and integration tests
5. **Compatibility**: Support latest Pinia version

## Plugin Registry

Submit your plugin to be featured in this list:

1. Fork the [documentation repository](https://github.com/vuejs/pinia/tree/v2/packages/docs)
2. Add your plugin to this page
3. Include description, features, and usage example
4. Submit a pull request

### Submission Requirements

- ✅ Open source with clear license
- ✅ Comprehensive documentation
- ✅ TypeScript support
- ✅ Test coverage > 80%
- ✅ Active maintenance
- ✅ Semantic versioning

## Frequently Asked Questions

### How do I choose the right plugin?

Consider these factors:
- **Functionality**: Does it solve your specific problem?
- **Maintenance**: Is it actively maintained?
- **Community**: Does it have good community support?
- **Performance**: Does it impact your app's performance?
- **Bundle Size**: How much does it add to your bundle?

### Can I use multiple plugins together?

Yes! Pinia plugins are designed to work together. However:
- Test compatibility between plugins
- Watch for naming conflicts
- Consider performance implications
- Check for duplicate functionality

### How do I debug plugin issues?

1. **Enable logging**: Use development mode
2. **Check order**: Plugin registration order matters
3. **Isolate**: Test plugins individually
4. **Version check**: Ensure compatibility
5. **Community**: Ask in discussions or issues

### What about SSR compatibility?

Most plugins support SSR, but always check:
- Plugin documentation
- Server-side rendering notes
- Hydration considerations
- Platform-specific features

## Contributing

Want to contribute to the Pinia ecosystem?

- **Report Issues**: Help improve existing plugins
- **Create Plugins**: Build new functionality
- **Write Documentation**: Improve guides and examples
- **Share Knowledge**: Write blog posts and tutorials

## Resources

- [Official Pinia Documentation](../)
- [Plugin Development Guide](../cookbook/plugin-development.md)
- [Community Discord](https://discord.gg/pinia)
- [GitHub Discussions](https://github.com/vuejs/pinia/discussions)
- [Awesome Pinia](https://github.com/piniajs/awesome-pinia)

---

*This list is community-maintained. Plugin quality and maintenance may vary. Always review plugins before using in production.*