import { defineConfig } from 'vitepress'

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig({
  title: 'Pinia Study Guide',
  description: 'The intuitive store for Vue.js - Complete learning guide',
  base: '/',
  
  // 国际化配置
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      title: 'Pinia Study Guide',
      description: 'The intuitive store for Vue.js - Complete learning guide',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/' },
          { text: 'API', link: '/api/' },
          { text: 'Examples', link: '/examples/' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Introduction',
              items: [
                { text: 'What is Pinia?', link: '/guide/introduction' },
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Installation', link: '/guide/installation' }
              ]
            },
            {
              text: 'Core Concepts',
              items: [
                { text: 'Defining a Store', link: '/guide/defining-stores' },
                { text: 'State', link: '/guide/state' },
                { text: 'Getters', link: '/guide/getters' },
                { text: 'Actions', link: '/guide/actions' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'defineStore', link: '/api/define-store' },
                { text: 'Store Instance', link: '/api/store-instance' },
                { text: 'Pinia Instance', link: '/api/pinia-instance' }
              ]
            }
          ]
        },
        editLink: {
          pattern: 'https://github.com/shingle666/allfun.net/edit/main/docs/:path',
          text: 'Edit this page on GitHub'
        }
      }
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'Pinia 学习指南',
      description: 'Vue.js 的直观状态管理库 - 完整学习指南',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/' },
          { text: 'API', link: '/zh/api/' },
          { text: '示例', link: '/zh/examples/' }
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '介绍',
              items: [
                { text: '什么是 Pinia？', link: '/zh/guide/introduction' },
                { text: '快速开始', link: '/zh/guide/getting-started' },
                { text: '安装', link: '/zh/guide/installation' }
              ]
            },
            {
              text: '核心概念',
              items: [
                { text: '定义 Store', link: '/zh/guide/defining-stores' },
                { text: 'State 状态', link: '/zh/guide/state' },
                { text: 'Getters', link: '/zh/guide/getters' },
                { text: 'Actions 动作', link: '/zh/guide/actions' }
              ]
            }
          ],
          '/zh/api/': [
            {
              text: 'API 参考',
              items: [
                { text: 'defineStore', link: '/zh/api/define-store' },
                { text: 'Store 实例', link: '/zh/api/store-instance' },
                { text: 'Pinia 实例', link: '/zh/api/pinia-instance' }
              ]
            }
          ]
        },
        editLink: {
          pattern: 'https://github.com/shingle666/allfun.net/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页面'
        }
      }
    }
  },
  
  // SEO 优化配置
  head: [
    // 基础 meta 标签
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'author', content: 'allfun.net' }],
    ['meta', { name: 'keywords', content: 'Pinia, Vue.js, State Management, JavaScript, TypeScript, 状态管理, 前端开发' }],
    
    // Open Graph / Facebook
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://allfun.net/' }],
    ['meta', { property: 'og:title', content: 'Pinia Study Guide - The intuitive store for Vue.js' }],
    ['meta', { property: 'og:description', content: 'Complete learning guide for Pinia, the intuitive store for Vue.js. Type Safe, Extensible, and Modular by design.' }],
    ['meta', { property: 'og:image', content: 'https://allfun.net/og-image.svg' }],
    ['meta', { property: 'og:site_name', content: 'Pinia Study Guide' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:url', content: 'https://allfun.net/' }],
    ['meta', { name: 'twitter:title', content: 'Pinia Study Guide - The intuitive store for Vue.js' }],
    ['meta', { name: 'twitter:description', content: 'Complete learning guide for Pinia, the intuitive store for Vue.js. Type Safe, Extensible, and Modular by design.' }],
    ['meta', { name: 'twitter:image', content: 'https://allfun.net/og-image.svg' }],
    
    // 其他 SEO 标签
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { name: 'googlebot', content: 'index, follow' }],
    ['link', { rel: 'canonical', href: 'https://allfun.net/' }],
    
    // 预加载关键资源
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    
    // PWA 配置
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'Pinia Guide' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.svg' }],
    
    // JSON-LD 结构化数据
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Pinia Study Guide',
      description: 'Complete learning guide for Pinia, the intuitive store for Vue.js',
      url: 'https://allfun.net',
      author: {
        '@type': 'Organization',
        name: 'allfun.net'
      },
      publisher: {
        '@type': 'Organization',
        name: 'allfun.net',
        url: 'https://allfun.net'
      }
    })]
  ],
  
  // Sitemap 配置
  sitemap: {
    hostname: 'https://allfun.net',
    transformItems: (items) => {
      return items.map(item => ({
        ...item,
        changefreq: 'weekly',
        priority: item.url === '/' ? 1.0 : 0.8
      }))
    }
  },
  
  // 默认深色主题
  appearance: 'dark',
  
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Pinia Study Guide',
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/shingle666' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 allfun.net'
    },
    
    search: {
      provider: 'local'
    }
  }
})
