# Pinia Study Guide

> The intuitive store for Vue.js - Complete learning guide

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![VitePress](https://img.shields.io/badge/VitePress-1.6.4-green.svg)](https://vitepress.dev/)
[![Vue](https://img.shields.io/badge/Vue-3.5.21-brightgreen.svg)](https://vuejs.org/)
[![Pinia](https://img.shields.io/badge/Pinia-3.0.3-yellow.svg)](https://pinia.vuejs.org/)

## 📖 项目简介

这是一个基于 VitePress 构建的 Pinia 完整学习指南文档站点。提供了从基础概念到高级应用的全面教程，帮助开发者快速掌握 Vue.js 官方状态管理库 Pinia 的使用。

### 🌟 特性

- 🍍 **完整的 Pinia 教程** - 从入门到精通的系统性学习路径
- 🔒 **TypeScript 支持** - 详细的 TypeScript 最佳实践和高级技巧
- 🌐 **国际化支持** - 提供中英文双语文档
- 📱 **响应式设计** - 适配各种设备的阅读体验
- 🔍 **搜索功能** - 快速查找所需内容
- 🎨 **现代化 UI** - 基于 VitePress 的美观界面
- ⚡ **快速加载** - 优化的构建和部署策略

## 📚 文档内容

### 📖 指南 (Guide)
- **入门指南** - Pinia 介绍、安装和快速开始
- **核心概念** - Store 定义、State、Getters、Actions
- **高级特性** - 插件系统、SSR 支持、测试策略
- **迁移指南** - 从 Vuex 迁移到 Pinia
- **最佳实践** - 项目架构和性能优化

### 🔧 API 参考 (API)
- **核心 API** - defineStore、createPinia 等
- **Store 实例** - 实例方法和属性
- **工具函数** - mapStores、storeToRefs 等
- **TypeScript 类型** - 完整的类型定义
- **插件 API** - 插件开发接口

### 🍳 实用教程 (Cookbook)
- **插件开发** - 自定义插件开发指南
- **TypeScript 最佳实践** - 类型安全的状态管理
- **高级 TypeScript** - 复杂场景的类型处理
- **组件测试** - 单元测试和集成测试
- **端到端测试** - E2E 测试策略

### 🌍 生态系统 (Ecosystem)
- **官方插件** - 持久化、ORM 等插件
- **社区插件** - 第三方扩展和工具
- **开发工具** - DevTools 和调试工具

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/shingle666/pinia.git
cd pinia

# 安装依赖
npm install
# 或
yarn install
```

### 本地开发

```bash
# 启动开发服务器
npm run dev
# 或
yarn dev
```

访问 `http://localhost:5173` 查看文档站点。

### 构建部署

```bash
# 构建生产版本
npm run build
# 或
yarn build

# 预览构建结果
npm run serve
# 或
yarn serve
```

## 📁 项目结构

```
allfun.net/
├── docs/                    # 文档源文件
│   ├── .vitepress/         # VitePress 配置
│   │   └── config.ts       # 站点配置文件
│   ├── api/                # API 参考文档
│   ├── cookbook/           # 实用教程
│   ├── ecosystem/          # 生态系统文档
│   ├── guide/              # 指南文档
│   ├── public/             # 静态资源
│   ├── ssr/                # SSR 相关文档
│   ├── zh/                 # 中文文档
│   │   ├── api/
│   │   ├── cookbook/
│   │   ├── ecosystem/
│   │   ├── guide/
│   │   └── ssr/
│   └── index.md            # 首页
├── package.json            # 项目配置
└── README.md              # 项目说明
```

## 🛠️ 技术栈

- **文档框架**: [VitePress](https://vitepress.dev/) - 基于 Vite 的静态站点生成器
- **构建工具**: [Vite](https://vitejs.dev/) - 下一代前端构建工具
- **前端框架**: [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- **状态管理**: [Pinia](https://pinia.vuejs.org/) - Vue 官方状态管理库
- **UI 组件**: [Element Plus](https://element-plus.org/) - Vue 3 组件库
- **HTTP 客户端**: [Axios](https://axios-http.com/) - Promise 基础的 HTTP 库

## 📝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 贡献类型

- 📖 **文档改进** - 修正错误、补充内容、优化表达
- 🐛 **问题修复** - 修复文档中的错误或问题
- ✨ **新增内容** - 添加新的教程、示例或最佳实践
- 🌐 **国际化** - 翻译文档或改进多语言支持
- 🎨 **界面优化** - 改进文档站点的设计和用户体验

### 文档编写规范

- 使用清晰、简洁的语言
- 提供完整的代码示例
- 包含必要的注释和说明
- 遵循 Markdown 格式规范
- 确保中英文文档的一致性

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🙏 致谢

- [Pinia](https://pinia.vuejs.org/) - 优秀的状态管理库
- [VitePress](https://vitepress.dev/) - 强大的文档生成工具
- [Vue.js](https://vuejs.org/) - 渐进式前端框架
- 所有贡献者和社区成员

## 📞 联系我们

- **GitHub**: [shingle666](https://github.com/shingle666)
- **网站**: [https://allfun.net](https://allfun.net)
- **问题反馈**: [GitHub Issues](https://github.com/shingle666/allfun.net/issues)

## 🔗 相关链接

- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue.js 官方文档](https://vuejs.org/)
- [VitePress 官方文档](https://vitepress.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！