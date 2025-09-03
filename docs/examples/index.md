---
title: Examples
description: Practical examples and code samples demonstrating various Pinia features and use cases.
head:
  - [meta, { name: description, content: "Practical examples and code samples demonstrating various Pinia features and use cases." }]
  - [meta, { name: keywords, content: "Pinia examples, Vue state management examples, code samples, tutorials" }]
  - [meta, { property: "og:title", content: "Examples - Pinia" }]
  - [meta, { property: "og:description", content: "Practical examples and code samples demonstrating various Pinia features and use cases." }]
---

# Examples

This section contains practical examples and code samples that demonstrate various Pinia features and real-world use cases. Each example includes complete, runnable code with explanations.

## Basic Examples

### [Counter Store](./counter-store.md)
A simple counter example demonstrating basic state management, actions, and getters.

### [Todo List](./todo-list.md)
A complete todo list application showcasing CRUD operations, computed properties, and local storage persistence.

### [User Authentication](./user-auth.md)
User authentication flow with login, logout, and protected routes using Pinia stores.

## Advanced Examples

### [Shopping Cart](./shopping-cart.md)
A full-featured shopping cart with product management, cart operations, and checkout process.

### [API Integration](./api-integration.md)
Demonstrates how to integrate Pinia with REST APIs, including loading states, error handling, and caching.

### [Real-time Chat](./realtime-chat.md)
Real-time chat application using WebSockets with Pinia for state management.

## Framework Integration

### [Nuxt.js Integration](./nuxt-integration.md)
Complete example of using Pinia with Nuxt.js, including SSR and hydration.

### [Vite + TypeScript](./vite-typescript.md)
Modern development setup with Vite, TypeScript, and Pinia with full type safety.

### [Testing Examples](./testing-examples.md)
Comprehensive testing examples for Pinia stores using Vitest and Vue Test Utils.

## Patterns and Best Practices

### [Store Composition](./store-composition.md)
Advanced patterns for composing multiple stores and sharing state between them.

### [Plugin Development](./plugin-development.md)
Examples of creating custom Pinia plugins for logging, persistence, and validation.

### [Performance Optimization](./performance-optimization.md)
Techniques for optimizing Pinia stores in large applications.

## Migration Examples

### [Vuex to Pinia Migration](./vuex-migration.md)
Step-by-step migration example from Vuex to Pinia with before/after code comparisons.

### [Redux to Pinia Migration](./redux-migration.md)
Migrating from Redux to Pinia in a React-to-Vue project transition.

## Getting Started

Each example includes:

- 📝 **Complete source code** - Ready to copy and run
- 🎯 **Clear explanations** - Understanding the concepts
- 🚀 **Live demos** - See it in action
- 📚 **Related documentation** - Links to relevant guides
- 🔧 **Setup instructions** - How to run the example

## Running the Examples

Most examples can be run independently. Here's the general setup:

```bash
# Clone the repository
git clone https://github.com/vuejs/pinia
cd pinia/examples

# Install dependencies
npm install

# Run a specific example
npm run dev:example-name
```

## Contributing Examples

We welcome contributions! If you have a useful Pinia example:

1. Fork the repository
2. Create your example in the appropriate directory
3. Follow the existing format and structure
4. Include proper documentation and comments
5. Submit a pull request

### Example Template

When creating new examples, please follow this structure:

```markdown
---
title: Example Title
description: Brief description of what this example demonstrates
---

# Example Title

## Overview
Brief explanation of the example and what it demonstrates.

## Features
- Feature 1
- Feature 2
- Feature 3

## Code

### Store Definition
```ts
// Your store code here
```

### Component Usage
```vue
<!-- Your component code here -->
```

## Key Concepts
Explanation of important concepts demonstrated.

## Related
- [Link to related documentation]
- [Link to related examples]
```

## Need Help?

If you have questions about any example:

- Check the [documentation](../guide/)
- Ask on [GitHub Discussions](https://github.com/vuejs/pinia/discussions)
- Join the [Vue Discord](https://discord.gg/vue)

---

*Examples are maintained by the Pinia team and community contributors.*