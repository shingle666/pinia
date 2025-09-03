---
title: 插件
description: 发现官方和社区 Pinia 插件，扩展你的 store 功能。
head:
  - [meta, { name: description, content: "发现官方和社区 Pinia 插件，扩展你的 store 功能。" }]
  - [meta, { name: keywords, content: "Pinia 插件, Vue 插件, 状态管理插件, Pinia 生态系统" }]
  - [meta, { property: "og:title", content: "插件 - Pinia" }]
  - [meta, { property: "og:description", content: "发现官方和社区 Pinia 插件，扩展你的 store 功能。" }]
---

# 插件

Pinia 的插件系统允许你使用可重用的功能扩展 store 功能。这里是官方和社区插件的综合列表。

## 官方插件

### Pinia Plugin Persistedstate

**在浏览器会话间持久化你的 Pinia stores。**

- **仓库**: [prazdevs/pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)
- **NPM**: `pinia-plugin-persistedstate`
- **功能**:
  - 多种存储选项（localStorage、sessionStorage、自定义）
  - 选择性状态持久化
  - 加密支持
  - SSR 兼容性
  - TypeScript 支持

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
// 在 store 中使用
export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: ''
  }),
  persist: true
})
```

### Pinia ORM

**Pinia stores 的对象关系映射。**

- **仓库**: [CodeDredd/pinia-orm](https://github.com/CodeDredd/pinia-orm)
- **NPM**: `@pinia-orm/core`
- **功能**:
  - 模型定义
  - 关系（hasOne、hasMany、belongsTo）
  - 查询构建器
  - 数据规范化
  - TypeScript 支持

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

## 开发工具

### Pinia DevTools

**Pinia stores 的增强调试体验。**

- **内置**: 在 Vue DevTools 中可用
- **功能**:
  - 时间旅行调试
  - 状态检查
  - 动作跟踪
  - Store 关系
  - 性能监控

### Pinia Logger

**Store 动作和变更的综合日志记录。**

- **仓库**: [wobsoriano/pinia-logger](https://github.com/wobsoriano/pinia-logger)
- **NPM**: `pinia-logger`
- **功能**:
  - 动作日志记录
  - 状态差异可视化
  - 可自定义日志级别
  - 性能指标

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

## 状态管理

### Pinia Shared State

**在多个 Pinia 实例间共享状态。**

- **仓库**: [wobsoriano/pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state)
- **NPM**: `pinia-shared-state`
- **功能**:
  - 跨实例同步
  - 选择性共享
  - 基于事件的更新
  - TypeScript 支持

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

**为你的 stores 添加撤销/重做功能。**

- **仓库**: [wobsoriano/pinia-undo](https://github.com/wobsoriano/pinia-undo)
- **NPM**: `pinia-undo`
- **功能**:
  - 撤销/重做操作
  - 历史管理
  - 选择性跟踪
  - 自定义序列化

```bash
npm install pinia-undo
```

```js
import { PiniaUndo } from 'pinia-undo'

pinia.use(PiniaUndo)

// 在你的 store 中
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

## 验证

### Pinia Yup

**使用 Yup 进行模式验证。**

- **仓库**: [wobsoriano/pinia-yup](https://github.com/wobsoriano/pinia-yup)
- **NPM**: `pinia-yup`
- **功能**:
  - 基于模式的验证
  - 异步验证
  - 错误处理
  - TypeScript 集成

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

**使用 Zod 进行模式验证。**

- **仓库**: [wobsoriano/pinia-zod](https://github.com/wobsoriano/pinia-zod)
- **NPM**: `pinia-zod`
- **功能**:
  - 类型安全验证
  - 运行时类型检查
  - 错误消息
  - 模式推断

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

## 测试

### Pinia Testing

**Pinia stores 的测试工具。**

- **仓库**: [posva/pinia-testing](https://github.com/posva/pinia-testing)
- **NPM**: `@pinia/testing`
- **功能**:
  - Store 模拟
  - 动作监听
  - 状态快照
  - 测试助手

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

## 网络与 API

### Pinia API

**Pinia 的 RESTful API 集成。**

- **仓库**: [wobsoriano/pinia-api](https://github.com/wobsoriano/pinia-api)
- **NPM**: `pinia-api`
- **功能**:
  - 自动 CRUD 操作
  - 请求缓存
  - 加载状态
  - 错误处理

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

**Pinia stores 的 GraphQL 集成。**

- **仓库**: [wobsoriano/pinia-graphql](https://github.com/wobsoriano/pinia-graphql)
- **NPM**: `pinia-graphql`
- **功能**:
  - 查询和变更支持
  - 订阅处理
  - 缓存管理
  - TypeScript 代码生成

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

## 性能

### Pinia Debounce

**防抖 store 动作和状态变化。**

- **仓库**: [wobsoriano/pinia-debounce](https://github.com/wobsoriano/pinia-debounce)
- **NPM**: `pinia-debounce`
- **功能**:
  - 动作防抖
  - 状态变化防抖
  - 可配置延迟
  - 取消支持

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
      // 这将被防抖
      console.log('搜索:', this.query)
    }
  },
  debounce: {
    search: 300
  }
})
```

### Pinia Cache

**Store 数据的高级缓存。**

- **仓库**: [wobsoriano/pinia-cache](https://github.com/wobsoriano/pinia-cache)
- **NPM**: `pinia-cache`
- **功能**:
  - 基于 TTL 的缓存
  - LRU 淘汰
  - 内存管理
  - 缓存失效

```bash
npm install pinia-cache
```

```js
import { PiniaCache } from 'pinia-cache'

pinia.use(PiniaCache({
  ttl: 60000, // 1 分钟
  max: 100    // 最大缓存条目
}))
```

## UI 集成

### Pinia Form

**带验证的表单状态管理。**

- **仓库**: [wobsoriano/pinia-form](https://github.com/wobsoriano/pinia-form)
- **NPM**: `pinia-form`
- **功能**:
  - 表单状态跟踪
  - 验证集成
  - 脏状态检测
  - 重置功能

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

**Pinia stores 的路由器集成。**

- **仓库**: [wobsoriano/pinia-router](https://github.com/wobsoriano/pinia-router)
- **NPM**: `pinia-router`
- **功能**:
  - 基于路由的 store 激活
  - 导航守卫
  - 查询参数绑定
  - 历史管理

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

## 移动端与原生

### Pinia React Native

**Pinia 的 React Native 集成。**

- **仓库**: [wobsoriano/pinia-react-native](https://github.com/wobsoriano/pinia-react-native)
- **NPM**: `pinia-react-native`
- **功能**:
  - AsyncStorage 持久化
  - 原生模块集成
  - 性能优化
  - 平台特定功能

```bash
npm install pinia-react-native
```

### Pinia Capacitor

**混合应用的 Capacitor 集成。**

- **仓库**: [wobsoriano/pinia-capacitor](https://github.com/wobsoriano/pinia-capacitor)
- **NPM**: `pinia-capacitor`
- **功能**:
  - 原生存储
  - 设备 API 集成
  - 离线支持
  - 平台检测

```bash
npm install pinia-capacitor
```

## 社区插件

### Pinia Class

**基于类的 store 定义。**

- **仓库**: [wobsoriano/pinia-class](https://github.com/wobsoriano/pinia-class)
- **NPM**: `pinia-class`
- **功能**:
  - 装饰器支持
  - 继承
  - 方法绑定
  - TypeScript 集成

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

**数据获取和缓存解决方案。**

- **仓库**: [posva/pinia-colada](https://github.com/posva/pinia-colada)
- **NPM**: `@pinia/colada`
- **功能**:
  - 智能缓存
  - 后台更新
  - 乐观更新
  - 错误边界

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

## 插件开发

### 创建你自己的插件

想要创建自己的插件？查看我们的综合指南：

- [插件开发指南](../cookbook/plugin-development.md)
- [插件 API 参考](../api/plugins.md)
- [TypeScript 插件开发](../cookbook/typescript-best-practices.md)

### 插件模板

使用我们的官方插件模板快速开始：

```bash
npx create-pinia-plugin my-awesome-plugin
```

### 发布指南

1. **命名约定**: npm 包使用 `pinia-` 前缀
2. **文档**: 包含综合的 README 和示例
3. **TypeScript**: 提供类型定义
4. **测试**: 包含单元和集成测试
5. **兼容性**: 支持最新的 Pinia 版本

## 插件注册表

提交你的插件以在此列表中展示：

1. Fork [文档仓库](https://github.com/vuejs/pinia/tree/v2/packages/docs)
2. 将你的插件添加到此页面
3. 包含描述、功能和使用示例
4. 提交 pull request

### 提交要求

- ✅ 开源且有明确许可证
- ✅ 综合文档
- ✅ TypeScript 支持
- ✅ 测试覆盖率 > 80%
- ✅ 积极维护
- ✅ 语义化版本

## 常见问题

### 如何选择合适的插件？

考虑这些因素：
- **功能性**: 它是否解决了你的特定问题？
- **维护**: 它是否被积极维护？
- **社区**: 它是否有良好的社区支持？
- **性能**: 它是否影响你的应用性能？
- **包大小**: 它为你的包增加了多少大小？

### 我可以同时使用多个插件吗？

可以！Pinia 插件被设计为可以一起工作。但是：
- 测试插件间的兼容性
- 注意命名冲突
- 考虑性能影响
- 检查重复功能

### 如何调试插件问题？

1. **启用日志**: 使用开发模式
2. **检查顺序**: 插件注册顺序很重要
3. **隔离**: 单独测试插件
4. **版本检查**: 确保兼容性
5. **社区**: 在讨论或问题中询问

### SSR 兼容性如何？

大多数插件支持 SSR，但总是要检查：
- 插件文档
- 服务端渲染说明
- 水合考虑
- 平台特定功能

## 贡献

想要为 Pinia 生态系统做贡献？

- **报告问题**: 帮助改进现有插件
- **创建插件**: 构建新功能
- **编写文档**: 改进指南和示例
- **分享知识**: 编写博客文章和教程

## 资源

- [官方 Pinia 文档](../)
- [插件开发指南](../cookbook/plugin-development.md)
- [社区 Discord](https://discord.gg/pinia)
- [GitHub 讨论](https://github.com/vuejs/pinia/discussions)
- [Awesome Pinia](https://github.com/piniajs/awesome-pinia)

---

*此列表由社区维护。插件质量和维护可能有所不同。在生产中使用前请始终审查插件。*