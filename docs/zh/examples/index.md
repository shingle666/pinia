---
title: 示例
description: 演示各种 Pinia 功能和用例的实用示例和代码样本。
head:
  - [meta, { name: description, content: "演示各种 Pinia 功能和用例的实用示例和代码样本。" }]
  - [meta, { name: keywords, content: "Pinia 示例, Vue 状态管理示例, 代码样本, 教程" }]
  - [meta, { property: "og:title", content: "示例 - Pinia" }]
  - [meta, { property: "og:description", content: "演示各种 Pinia 功能和用例的实用示例和代码样本。" }]
---

# 示例

本节包含演示各种 Pinia 功能和实际用例的实用示例和代码样本。每个示例都包含完整的、可运行的代码和解释。

## 基础示例

### [计数器 Store](./counter-store.md)
一个简单的计数器示例，演示基本的状态管理、操作和 getter。

### [待办事项列表](./todo-list.md)
一个完整的待办事项应用程序，展示 CRUD 操作、计算属性和本地存储持久化。

### [用户认证](./user-auth.md)
使用 Pinia store 的用户认证流程，包括登录、登出和受保护的路由。

## 高级示例

### [购物车](./shopping-cart.md)
功能完整的购物车，包含产品管理、购物车操作和结账流程。

### [API 集成](./api-integration.md)
演示如何将 Pinia 与 REST API 集成，包括加载状态、错误处理和缓存。

### [实时聊天](./realtime-chat.md)
使用 WebSocket 和 Pinia 进行状态管理的实时聊天应用程序。

## 框架集成

### [Nuxt.js 集成](./nuxt-integration.md)
使用 Pinia 与 Nuxt.js 的完整示例，包括 SSR 和水合。

### [Vite + TypeScript](./vite-typescript.md)
使用 Vite、TypeScript 和 Pinia 的现代开发设置，具有完整的类型安全。

### [测试示例](./testing-examples.md)
使用 Vitest 和 Vue Test Utils 对 Pinia store 进行全面测试的示例。

## 模式和最佳实践

### [Store 组合](./store-composition.md)
组合多个 store 和在它们之间共享状态的高级模式。

### [插件开发](./plugin-development.md)
创建用于日志记录、持久化和验证的自定义 Pinia 插件示例。

### [性能优化](./performance-optimization.md)
在大型应用程序中优化 Pinia store 的技术。

## 迁移示例

### [Vuex 到 Pinia 迁移](./vuex-migration.md)
从 Vuex 到 Pinia 的分步迁移示例，包含前后代码对比。

### [Redux 到 Pinia 迁移](./redux-migration.md)
在 React 到 Vue 项目转换中从 Redux 迁移到 Pinia。

## 开始使用

每个示例都包含：

- 📝 **完整源代码** - 可直接复制和运行
- 🎯 **清晰解释** - 理解概念
- 🚀 **在线演示** - 查看实际效果
- 📚 **相关文档** - 相关指南的链接
- 🔧 **设置说明** - 如何运行示例

## 运行示例

大多数示例都可以独立运行。以下是一般设置：

```bash
# 克隆仓库
git clone https://github.com/vuejs/pinia
cd pinia/examples

# 安装依赖
npm install

# 运行特定示例
npm run dev:example-name
```

## 贡献示例

我们欢迎贡献！如果您有有用的 Pinia 示例：

1. Fork 仓库
2. 在适当的目录中创建您的示例
3. 遵循现有的格式和结构
4. 包含适当的文档和注释
5. 提交 pull request

### 示例模板

创建新示例时，请遵循以下结构：

```markdown
---
title: 示例标题
description: 此示例演示内容的简要描述
---

# 示例标题

## 概述
示例的简要说明以及它演示的内容。

## 功能
- 功能 1
- 功能 2
- 功能 3

## 代码

### Store 定义
```ts
// 您的 store 代码
```

### 组件使用
```vue
<!-- 您的组件代码 -->
```

## 关键概念
演示的重要概念的解释。

## 相关
- [相关文档链接]
- [相关示例链接]
```

## 需要帮助？

如果您对任何示例有疑问：

- 查看[文档](../guide/)
- 在 [GitHub Discussions](https://github.com/vuejs/pinia/discussions) 上提问
- 加入 [Vue Discord](https://discord.gg/vue)

---

*示例由 Pinia 团队和社区贡献者维护。*