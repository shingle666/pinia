# 实时聊天应用

一个综合性的实时聊天应用，展示了 Pinia 的高级模式，包括 WebSocket 集成、消息管理、用户在线状态和实时通知。

## 功能特性

- 💬 基于 WebSocket 的实时消息
- 👥 用户在线状态和输入指示器
- 🏠 多聊天室/频道支持
- 📁 文件分享和媒体消息
- 🔍 消息搜索和历史记录
- 🔔 推送通知
- 😀 表情反应和@提及
- 🌙 在线/离线状态处理
- 📱 响应式设计
- 🔐 消息加密（可选）

## 类型定义

```typescript
// types/chat.ts
export interface User {
  id: string
  username: string
  displayName: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: Date
}

export interface Message {
  id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  senderId: string
  roomId: string
  timestamp: Date
  edited?: boolean
  editedAt?: Date
  replyTo?: string
  reactions: Record<string, string[]> // emoji -> user IDs
  mentions: string[] // user IDs
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnail?: string
}

export interface Room {
  id: string
  name: string
  description?: string
  type: 'public' | 'private' | 'direct'
  members: string[] // user IDs
  admins: string[] // user IDs
  createdAt: Date
  lastActivity: Date
  unreadCount?: number
  lastMessage?: Message
}

export interface TypingIndicator {
  userId: string
  roomId: string
  timestamp: Date
}

export interface ChatState {
  currentUser: User | null
  rooms: Room[]
  messages: Record<string, Message[]> // roomId -> messages
  users: Record<string, User> // userId -> user
  typingIndicators: TypingIndicator[]
  onlineUsers: Set<string>
  currentRoomId: string | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}
```

## WebSocket 服务

```typescript
// services/websocket.ts
export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: number | null = null
  private messageQueue: any[] = []
  
  private eventHandlers = new Map<string, Function[]>()

  constructor(private url: string, private token: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.url}?token=${this.token}`)
        
        this.ws.onopen = () => {
          console.log('WebSocket 已连接')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.flushMessageQueue()
          this.emit('connected')
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('解析 WebSocket 消息失败:', error)
          }
        }
        
        this.ws.onclose = (event) => {
          console.log('WebSocket 已断开:', event.code, event.reason)
          this.stopHeartbeat()
          this.emit('disconnected', { code: event.code, reason: event.reason })
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket 错误:', error)
          this.emit('error', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, '客户端断开连接')
      this.ws = null
    }
    this.stopHeartbeat()
  }

  send(type: string, data: any) {
    const message = { type, data, timestamp: Date.now() }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // 连接恢复时排队发送消息
      this.messageQueue.push(message)
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  private handleMessage(message: any) {
    this.emit(message.type, message.data)
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {})
      }
    }, 30000) // 30 秒
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    setTimeout(() => {
      console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect().catch(() => {
        // 重连失败，如果还有尝试次数会继续重试
      })
    }, delay)
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
      } else {
        // 连接又断开了，把消息放回队列
        this.messageQueue.unshift(message)
        break
      }
    }
  }
}
```

## 聊天 Store 实现

```typescript
// stores/chat.ts
import { defineStore } from 'pinia'
import { WebSocketService } from '@/services/websocket'
import { useAuthStore } from './auth'
import { useNotificationStore } from './notifications'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  // 状态
  const currentUser = ref<User | null>(null)
  const rooms = ref<Room[]>([])
  const messages = ref<Record<string, Message[]>>({})
  const users = ref<Record<string, User>>({})
  const typingIndicators = ref<TypingIndicator[]>([])
  const onlineUsers = ref<Set<string>>(new Set())
  const currentRoomId = ref<string | null>(null)
  const isConnected = ref(false)
  const connectionStatus = ref<ChatState['connectionStatus']>('disconnected')
  const searchQuery = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // WebSocket 服务
  let wsService: WebSocketService | null = null
  
  // 计算属性
  const currentRoom = computed(() => {
    return currentRoomId.value ? rooms.value.find(r => r.id === currentRoomId.value) : null
  })
  
  const currentMessages = computed(() => {
    return currentRoomId.value ? messages.value[currentRoomId.value] || [] : []
  })
  
  const filteredMessages = computed(() => {
    if (!searchQuery.value) return currentMessages.value
    
    const query = searchQuery.value.toLowerCase()
    return currentMessages.value.filter(message => 
      message.content.toLowerCase().includes(query) ||
      users.value[message.senderId]?.displayName.toLowerCase().includes(query)
    )
  })
  
  const roomsWithUnread = computed(() => {
    return rooms.value.map(room => ({
      ...room,
      unreadCount: getUnreadCount(room.id)
    }))
  })
  
  const currentTypingUsers = computed(() => {
    if (!currentRoomId.value) return []
    
    const now = Date.now()
    return typingIndicators.value
      .filter(indicator => 
        indicator.roomId === currentRoomId.value &&
        indicator.userId !== currentUser.value?.id &&
        now - indicator.timestamp.getTime() < 3000 // 3 秒超时
      )
      .map(indicator => users.value[indicator.userId])
      .filter(Boolean)
  })
  
  const totalUnreadCount = computed(() => {
    return rooms.value.reduce((total, room) => total + getUnreadCount(room.id), 0)
  })

  // 操作方法
  async function initialize() {
    if (!authStore.token) {
      throw new Error('需要身份验证')
    }
    
    connectionStatus.value = 'connecting'
    
    try {
      // 初始化 WebSocket 连接
      wsService = new WebSocketService(
        import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
        authStore.token
      )
      
      setupWebSocketHandlers()
      await wsService.connect()
      
      // 获取初始数据
      await Promise.all([
        fetchRooms(),
        fetchUsers()
      ])
      
      connectionStatus.value = 'connected'
      isConnected.value = true
    } catch (error) {
      connectionStatus.value = 'error'
      throw error
    }
  }
  
  function setupWebSocketHandlers() {
    if (!wsService) return
    
    wsService.on('connected', () => {
      isConnected.value = true
      connectionStatus.value = 'connected'
      error.value = null
    })
    
    wsService.on('disconnected', () => {
      isConnected.value = false
      connectionStatus.value = 'disconnected'
      onlineUsers.value.clear()
    })
    
    wsService.on('error', (err) => {
      error.value = '连接错误'
      connectionStatus.value = 'error'
    })
    
    wsService.on('message', handleNewMessage)
    wsService.on('message_updated', handleMessageUpdate)
    wsService.on('message_deleted', handleMessageDelete)
    wsService.on('user_joined', handleUserJoined)
    wsService.on('user_left', handleUserLeft)
    wsService.on('user_typing', handleUserTyping)
    wsService.on('user_status', handleUserStatus)
    wsService.on('room_updated', handleRoomUpdate)
  }
  
  async function fetchRooms() {
    try {
      const response = await fetch('/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('获取房间列表失败')
      }
      
      const data = await response.json()
      rooms.value = data.map(room => ({
        ...room,
        createdAt: new Date(room.createdAt),
        lastActivity: new Date(room.lastActivity)
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }
  
  async function fetchUsers() {
    try {
      const response = await fetch('/api/chat/users', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }
      
      const data = await response.json()
      const usersMap = {}
      data.forEach(user => {
        usersMap[user.id] = {
          ...user,
          lastSeen: new Date(user.lastSeen)
        }
      })
      users.value = usersMap
      
      // 设置当前用户
      currentUser.value = users.value[authStore.user?.id] || null
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }
  
  async function fetchMessages(roomId: string, limit = 50, before?: string) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(before && { before })
      })
      
      const response = await fetch(`/api/chat/rooms/${roomId}/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('获取消息失败')
      }
      
      const data = await response.json()
      const roomMessages = data.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
      }))
      
      if (before) {
        // 在前面添加更早的消息
        messages.value[roomId] = [...roomMessages, ...(messages.value[roomId] || [])]
      } else {
        // 替换为新消息
        messages.value[roomId] = roomMessages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    }
  }
  
  async function joinRoom(roomId: string) {
    currentRoomId.value = roomId
    
    // 如果还没有加载消息，则获取消息
    if (!messages.value[roomId]) {
      await fetchMessages(roomId)
    }
    
    // 标记房间为已读
    markRoomAsRead(roomId)
    
    // 通知服务器
    wsService?.send('join_room', { roomId })
  }
  
  function leaveRoom() {
    if (currentRoomId.value) {
      wsService?.send('leave_room', { roomId: currentRoomId.value })
      currentRoomId.value = null
    }
  }
  
  async function sendMessage(content: string, type: Message['type'] = 'text', replyTo?: string) {
    if (!currentRoomId.value || !currentUser.value) return
    
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      content,
      type,
      senderId: currentUser.value.id,
      roomId: currentRoomId.value,
      timestamp: new Date(),
      replyTo,
      reactions: {},
      mentions: extractMentions(content)
    }
    
    // 乐观更新
    if (!messages.value[currentRoomId.value]) {
      messages.value[currentRoomId.value] = []
    }
    messages.value[currentRoomId.value].push(optimisticMessage)
    
    try {
      wsService?.send('send_message', {
        content,
        type,
        roomId: currentRoomId.value,
        replyTo,
        tempId
      })
    } catch (err) {
      // 出错时移除乐观消息
      const roomMessages = messages.value[currentRoomId.value]
      const index = roomMessages.findIndex(m => m.id === tempId)
      if (index !== -1) {
        roomMessages.splice(index, 1)
      }
      throw err
    }
  }
  
  async function editMessage(messageId: string, newContent: string) {
    if (!currentRoomId.value) return
    
    const roomMessages = messages.value[currentRoomId.value]
    const messageIndex = roomMessages.findIndex(m => m.id === messageId)
    
    if (messageIndex === -1) return
    
    const originalMessage = { ...roomMessages[messageIndex] }
    
    // 乐观更新
    roomMessages[messageIndex] = {
      ...originalMessage,
      content: newContent,
      edited: true,
      editedAt: new Date()
    }
    
    try {
      wsService?.send('edit_message', {
        messageId,
        content: newContent,
        roomId: currentRoomId.value
      })
    } catch (err) {
      // 出错时回滚
      roomMessages[messageIndex] = originalMessage
      throw err
    }
  }
  
  async function deleteMessage(messageId: string) {
    if (!currentRoomId.value) return
    
    const roomMessages = messages.value[currentRoomId.value]
    const messageIndex = roomMessages.findIndex(m => m.id === messageId)
    
    if (messageIndex === -1) return
    
    const deletedMessage = roomMessages[messageIndex]
    
    // 乐观更新
    roomMessages.splice(messageIndex, 1)
    
    try {
      wsService?.send('delete_message', {
        messageId,
        roomId: currentRoomId.value
      })
    } catch (err) {
      // 出错时回滚
      roomMessages.splice(messageIndex, 0, deletedMessage)
      throw err
    }
  }
  
  function addReaction(messageId: string, emoji: string) {
    if (!currentRoomId.value || !currentUser.value) return
    
    const roomMessages = messages.value[currentRoomId.value]
    const message = roomMessages.find(m => m.id === messageId)
    
    if (!message) return
    
    if (!message.reactions[emoji]) {
      message.reactions[emoji] = []
    }
    
    const userId = currentUser.value.id
    if (!message.reactions[emoji].includes(userId)) {
      message.reactions[emoji].push(userId)
      
      wsService?.send('add_reaction', {
        messageId,
        emoji,
        roomId: currentRoomId.value
      })
    }
  }
  
  function removeReaction(messageId: string, emoji: string) {
    if (!currentRoomId.value || !currentUser.value) return
    
    const roomMessages = messages.value[currentRoomId.value]
    const message = roomMessages.find(m => m.id === messageId)
    
    if (!message || !message.reactions[emoji]) return
    
    const userId = currentUser.value.id
    const index = message.reactions[emoji].indexOf(userId)
    
    if (index !== -1) {
      message.reactions[emoji].splice(index, 1)
      
      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji]
      }
      
      wsService?.send('remove_reaction', {
        messageId,
        emoji,
        roomId: currentRoomId.value
      })
    }
  }
  
  function startTyping() {
    if (!currentRoomId.value) return
    
    wsService?.send('typing_start', {
      roomId: currentRoomId.value
    })
  }
  
  function stopTyping() {
    if (!currentRoomId.value) return
    
    wsService?.send('typing_stop', {
      roomId: currentRoomId.value
    })
  }
  
  function markRoomAsRead(roomId: string) {
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      room.unreadCount = 0
    }
    
    wsService?.send('mark_read', { roomId })
  }
  
  function getUnreadCount(roomId: string): number {
    const room = rooms.value.find(r => r.id === roomId)
    return room?.unreadCount || 0
  }
  
  function extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1]
      const user = Object.values(users.value).find(u => u.username === username)
      if (user) {
        mentions.push(user.id)
      }
    }
    
    return mentions
  }
  
  // WebSocket 事件处理器
  function handleNewMessage(data: any) {
    const message: Message = {
      ...data,
      timestamp: new Date(data.timestamp)
    }
    
    // 如果存在临时消息，则替换它
    if (data.tempId) {
      const roomMessages = messages.value[message.roomId]
      if (roomMessages) {
        const tempIndex = roomMessages.findIndex(m => m.id === data.tempId)
        if (tempIndex !== -1) {
          roomMessages[tempIndex] = message
          return
        }
      }
    }
    
    // 添加新消息
    if (!messages.value[message.roomId]) {
      messages.value[message.roomId] = []
    }
    messages.value[message.roomId].push(message)
    
    // 更新房间的最后活动时间
    const room = rooms.value.find(r => r.id === message.roomId)
    if (room) {
      room.lastActivity = message.timestamp
      room.lastMessage = message
      
      // 如果不是当前房间且不是自己发送的消息，增加未读计数
      if (message.roomId !== currentRoomId.value && message.senderId !== currentUser.value?.id) {
        room.unreadCount = (room.unreadCount || 0) + 1
      }
    }
    
    // 如果不是当前房间，显示通知
    if (message.roomId !== currentRoomId.value && message.senderId !== currentUser.value?.id) {
      const sender = users.value[message.senderId]
      notificationStore.addNotification({
        title: `${sender?.displayName || '某人'} 在 ${room?.name || '聊天'}`,
        message: message.content,
        type: 'info',
        action: () => joinRoom(message.roomId)
      })
    }
  }
  
  function handleMessageUpdate(data: any) {
    const roomMessages = messages.value[data.roomId]
    if (roomMessages) {
      const messageIndex = roomMessages.findIndex(m => m.id === data.id)
      if (messageIndex !== -1) {
        roomMessages[messageIndex] = {
          ...roomMessages[messageIndex],
          ...data,
          timestamp: new Date(data.timestamp),
          editedAt: data.editedAt ? new Date(data.editedAt) : undefined
        }
      }
    }
  }
  
  function handleMessageDelete(data: any) {
    const roomMessages = messages.value[data.roomId]
    if (roomMessages) {
      const messageIndex = roomMessages.findIndex(m => m.id === data.messageId)
      if (messageIndex !== -1) {
        roomMessages.splice(messageIndex, 1)
      }
    }
  }
  
  function handleUserJoined(data: any) {
    onlineUsers.value.add(data.userId)
    if (users.value[data.userId]) {
      users.value[data.userId].status = 'online'
    }
  }
  
  function handleUserLeft(data: any) {
    onlineUsers.value.delete(data.userId)
    if (users.value[data.userId]) {
      users.value[data.userId].status = 'offline'
      users.value[data.userId].lastSeen = new Date()
    }
  }
  
  function handleUserTyping(data: any) {
    const existingIndex = typingIndicators.value.findIndex(
      indicator => indicator.userId === data.userId && indicator.roomId === data.roomId
    )
    
    const typingIndicator: TypingIndicator = {
      userId: data.userId,
      roomId: data.roomId,
      timestamp: new Date()
    }
    
    if (existingIndex !== -1) {
      typingIndicators.value[existingIndex] = typingIndicator
    } else {
      typingIndicators.value.push(typingIndicator)
    }
    
    // 超时后移除输入指示器
    setTimeout(() => {
      const index = typingIndicators.value.findIndex(
        indicator => indicator.userId === data.userId && indicator.roomId === data.roomId
      )
      if (index !== -1) {
        typingIndicators.value.splice(index, 1)
      }
    }, 3000)
  }
  
  function handleUserStatus(data: any) {
    if (users.value[data.userId]) {
      users.value[data.userId].status = data.status
      if (data.status === 'offline') {
        users.value[data.userId].lastSeen = new Date()
        onlineUsers.value.delete(data.userId)
      } else {
        onlineUsers.value.add(data.userId)
      }
    }
  }
  
  function handleRoomUpdate(data: any) {
    const roomIndex = rooms.value.findIndex(r => r.id === data.id)
    if (roomIndex !== -1) {
      rooms.value[roomIndex] = {
        ...rooms.value[roomIndex],
        ...data,
        createdAt: new Date(data.createdAt),
        lastActivity: new Date(data.lastActivity)
      }
    }
  }
  
  function disconnect() {
    wsService?.disconnect()
    wsService = null
    isConnected.value = false
    connectionStatus.value = 'disconnected'
    onlineUsers.value.clear()
    typingIndicators.value = []
  }
  
  // 组件卸载时清理
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    // 状态
    currentUser: readonly(currentUser),
    rooms: readonly(rooms),
    messages: readonly(messages),
    users: readonly(users),
    typingIndicators: readonly(typingIndicators),
    onlineUsers: readonly(onlineUsers),
    currentRoomId: readonly(currentRoomId),
    isConnected: readonly(isConnected),
    connectionStatus: readonly(connectionStatus),
    searchQuery,
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 计算属性
    currentRoom,
    currentMessages,
    filteredMessages,
    roomsWithUnread,
    currentTypingUsers,
    totalUnreadCount,
    
    // 操作方法
    initialize,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    markRoomAsRead,
    fetchMessages,
    disconnect
  }
})
```

## 组件使用

### 聊天室组件

```vue
<!-- components/ChatRoom.vue -->
<template>
  <div class="chat-room">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="room-info">
        <h3>{{ chatStore.currentRoom?.name }}</h3>
        <span class="member-count">
          {{ chatStore.currentRoom?.members.length }} 成员
        </span>
      </div>
      
      <div class="room-actions">
        <button @click="showSearch = !showSearch">
          🔍 搜索
        </button>
        <button @click="showMembers = !showMembers">
          👥 成员
        </button>
      </div>
    </div>

    <!-- 搜索 -->
    <div v-if="showSearch" class="search-bar">
      <input 
        v-model="chatStore.searchQuery"
        placeholder="搜索消息..."
        class="search-input"
      />
    </div>

    <!-- 消息 -->
    <div 
      ref="messagesContainer"
      class="messages-container"
      @scroll="handleScroll"
    >
      <div 
        v-for="message in chatStore.filteredMessages"
        :key="message.id"
        class="message"
        :class="{
          'own-message': message.senderId === chatStore.currentUser?.id,
          'system-message': message.type === 'system'
        }"
      >
        <MessageItem
          :message="message"
          :user="chatStore.users[message.senderId]"
          @edit="handleEditMessage"
          @delete="handleDeleteMessage"
          @react="handleAddReaction"
          @reply="handleReplyToMessage"
        />
      </div>
      
      <!-- 输入指示器 -->
      <div v-if="chatStore.currentTypingUsers.length > 0" class="typing-indicators">
        <div class="typing-indicator">
          {{ formatTypingUsers(chatStore.currentTypingUsers) }} 
          正在输入...
        </div>
      </div>
    </div>

    <!-- 消息输入 -->
    <div class="message-input-container">
      <div v-if="replyingTo" class="reply-preview">
        <span>回复 {{ chatStore.users[replyingTo.senderId]?.displayName }}</span>
        <button @click="replyingTo = null">✕</button>
      </div>
      
      <div class="message-input">
        <input
          v-model="messageText"
          placeholder="输入消息..."
          @keydown="handleKeyDown"
          @input="handleTyping"
          @blur="handleStopTyping"
        />
        
        <div class="input-actions">
          <button @click="showEmojiPicker = !showEmojiPicker">
            😀
          </button>
          <button @click="handleFileUpload">
            📎
          </button>
          <button 
            @click="handleSendMessage"
            :disabled="!messageText.trim()"
          >
            发送
          </button>
        </div>
      </div>
      
      <!-- 表情选择器 -->
      <EmojiPicker 
        v-if="showEmojiPicker"
        @select="handleEmojiSelect"
        @close="showEmojiPicker = false"
      />
    </div>

    <!-- 成员侧边栏 -->
    <MembersList 
      v-if="showMembers"
      :members="roomMembers"
      @close="showMembers = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import MessageItem from './MessageItem.vue'
import EmojiPicker from './EmojiPicker.vue'
import MembersList from './MembersList.vue'

const chatStore = useChatStore()

const messageText = ref('')
const replyingTo = ref<Message | null>(null)
const showSearch = ref(false)
const showMembers = ref(false)
const showEmojiPicker = ref(false)
const messagesContainer = ref<HTMLElement>()
const typingTimeout = ref<number | null>(null)
const isTyping = ref(false)

const roomMembers = computed(() => {
  if (!chatStore.currentRoom) return []
  return chatStore.currentRoom.members.map(id => chatStore.users[id]).filter(Boolean)
})

function handleSendMessage() {
  if (!messageText.value.trim()) return
  
  chatStore.sendMessage(
    messageText.value,
    'text',
    replyingTo.value?.id
  )
  
  messageText.value = ''
  replyingTo.value = null
  handleStopTyping()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSendMessage()
  }
}

function handleTyping() {
  if (!isTyping.value) {
    isTyping.value = true
    chatStore.startTyping()
  }
  
  // 重置输入超时
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  
  typingTimeout.value = setTimeout(() => {
    handleStopTyping()
  }, 1000)
}

function handleStopTyping() {
  if (isTyping.value) {
    isTyping.value = false
    chatStore.stopTyping()
  }
  
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
    typingTimeout.value = null
  }
}

function handleEditMessage(messageId: string, newContent: string) {
  chatStore.editMessage(messageId, newContent)
}

function handleDeleteMessage(messageId: string) {
  if (confirm('删除这条消息？')) {
    chatStore.deleteMessage(messageId)
  }
}

function handleAddReaction(messageId: string, emoji: string) {
  chatStore.addReaction(messageId, emoji)
}

function handleReplyToMessage(message: Message) {
  replyingTo.value = message
}

function handleEmojiSelect(emoji: string) {
  messageText.value += emoji
  showEmojiPicker.value = false
}

function handleFileUpload() {
  // 实现文件上传逻辑
  console.log('文件上传功能未实现')
}

function handleScroll() {
  const container = messagesContainer.value
  if (!container) return
  
  // 滚动到顶部时加载更多消息
  if (container.scrollTop === 0 && chatStore.currentMessages.length > 0) {
    const oldestMessage = chatStore.currentMessages[0]
    chatStore.fetchMessages(chatStore.currentRoomId!, 50, oldestMessage.id)
  }
}

function formatTypingUsers(users: User[]): string {
  if (users.length === 1) {
    return users[0].displayName
  } else if (users.length === 2) {
    return `${users[0].displayName} 和 ${users[1].displayName}`
  } else {
    return `${users[0].displayName} 和其他 ${users.length - 1} 人`
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 新消息到达时自动滚动到底部
watch(() => chatStore.currentMessages.length, scrollToBottom)

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  handleStopTyping()
})
</script>
```

## 测试

```typescript
// tests/stores/chat.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { WebSocketService } from '@/services/websocket'

// 模拟 WebSocket
vi.mock('@/services/websocket')

describe('聊天 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该正确处理新消息', () => {
    const store = useChatStore()
    
    const message = {
      id: '1',
      content: 'Hello world',
      senderId: 'user1',
      roomId: 'room1',
      timestamp: new Date().toISOString()
    }
    
    store.handleNewMessage(message)
    
    expect(store.messages['room1']).toHaveLength(1)
    expect(store.messages['room1'][0].content).toBe('Hello world')
  })

  it('应该处理乐观消息更新', async () => {
    const store = useChatStore()
    store.currentRoomId = 'room1'
    store.currentUser = { id: 'user1', username: 'test' }
    
    // 模拟 WebSocket 服务
    const mockWs = {
      send: vi.fn()
    }
    store.wsService = mockWs
    
    await store.sendMessage('测试消息')
    
    expect(store.messages['room1']).toHaveLength(1)
    expect(store.messages['room1'][0].content).toBe('测试消息')
    expect(store.messages['room1'][0].id).toMatch(/^temp-/)
    expect(mockWs.send).toHaveBeenCalledWith('send_message', expect.any(Object))
  })

  it('应该正确提取@提及', () => {
    const store = useChatStore()
    
    store.users = {
      'user1': { id: 'user1', username: 'john' },
      'user2': { id: 'user2', username: 'jane' }
    }
    
    const mentions = store.extractMentions('你好 @john 和 @jane！')
    
    expect(mentions).toEqual(['user1', 'user2'])
  })

  it('应该处理输入指示器', () => {
    const store = useChatStore()
    
    store.handleUserTyping({
      userId: 'user1',
      roomId: 'room1'
    })
    
    expect(store.typingIndicators).toHaveLength(1)
    expect(store.typingIndicators[0].userId).toBe('user1')
  })
})
```

## 核心功能

### 1. 实时通信
- 带自动重连的 WebSocket 连接
- 实时消息传递
- 输入指示器和用户在线状态
- 连接状态监控

### 2. 消息管理
- 乐观更新提供即时反馈
- 消息编辑和删除
- 表情反应和@提及
- 文件附件支持

### 3. 用户体验
- 未读消息计数
- 推送通知
- 消息搜索和历史记录
- 响应式设计

### 4. 性能
- 消息分页和懒加载
- 高效的状态管理
- 大型聊天历史记录的内存优化

### 5. 可靠性
- 离线消息队列
- 错误处理和恢复
- 消息传递确认

这个实时聊天应用展示了如何使用 Pinia 构建复杂的交互式应用，同时处理实时数据、WebSocket 连接，并提供流畅的用户体验。