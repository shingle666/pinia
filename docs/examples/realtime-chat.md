# Real-time Chat Application

A comprehensive real-time chat application demonstrating advanced Pinia patterns with WebSocket integration, message management, user presence, and real-time notifications.

## Features

- 💬 Real-time messaging with WebSocket
- 👥 User presence and typing indicators
- 🏠 Multiple chat rooms/channels
- 📁 File sharing and media messages
- 🔍 Message search and history
- 🔔 Push notifications
- 😀 Emoji reactions and mentions
- 🌙 Online/offline status handling
- 📱 Responsive design
- 🔐 Message encryption (optional)

## Type Definitions

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

## WebSocket Service

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
          console.log('WebSocket connected')
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
            console.error('Failed to parse WebSocket message:', error)
          }
        }
        
        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.stopHeartbeat()
          this.emit('disconnected', { code: event.code, reason: event.reason })
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
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
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.stopHeartbeat()
  }

  send(type: string, data: any) {
    const message = { type, data, timestamp: Date.now() }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is restored
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
    }, 30000) // 30 seconds
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
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect().catch(() => {
        // Reconnection failed, will try again if attempts remain
      })
    }, delay)
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
      } else {
        // Connection lost again, put message back
        this.messageQueue.unshift(message)
        break
      }
    }
  }
}
```

## Chat Store Implementation

```typescript
// stores/chat.ts
import { defineStore } from 'pinia'
import { WebSocketService } from '@/services/websocket'
import { useAuthStore } from './auth'
import { useNotificationStore } from './notifications'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  // State
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
  
  // WebSocket service
  let wsService: WebSocketService | null = null
  
  // Getters
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
        now - indicator.timestamp.getTime() < 3000 // 3 seconds timeout
      )
      .map(indicator => users.value[indicator.userId])
      .filter(Boolean)
  })
  
  const totalUnreadCount = computed(() => {
    return rooms.value.reduce((total, room) => total + getUnreadCount(room.id), 0)
  })

  // Actions
  async function initialize() {
    if (!authStore.token) {
      throw new Error('Authentication required')
    }
    
    connectionStatus.value = 'connecting'
    
    try {
      // Initialize WebSocket connection
      wsService = new WebSocketService(
        import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
        authStore.token
      )
      
      setupWebSocketHandlers()
      await wsService.connect()
      
      // Fetch initial data
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
      error.value = 'Connection error'
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
        throw new Error('Failed to fetch rooms')
      }
      
      const data = await response.json()
      rooms.value = data.map(room => ({
        ...room,
        createdAt: new Date(room.createdAt),
        lastActivity: new Date(room.lastActivity)
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
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
        throw new Error('Failed to fetch users')
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
      
      // Set current user
      currentUser.value = users.value[authStore.user?.id] || null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
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
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      const roomMessages = data.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
      }))
      
      if (before) {
        // Prepend older messages
        messages.value[roomId] = [...roomMessages, ...(messages.value[roomId] || [])]
      } else {
        // Replace with new messages
        messages.value[roomId] = roomMessages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }
  
  async function joinRoom(roomId: string) {
    currentRoomId.value = roomId
    
    // Fetch messages if not already loaded
    if (!messages.value[roomId]) {
      await fetchMessages(roomId)
    }
    
    // Mark room as read
    markRoomAsRead(roomId)
    
    // Notify server
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
    
    // Optimistic update
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
      // Remove optimistic message on error
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
    
    // Optimistic update
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
      // Rollback on error
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
    
    // Optimistic update
    roomMessages.splice(messageIndex, 1)
    
    try {
      wsService?.send('delete_message', {
        messageId,
        roomId: currentRoomId.value
      })
    } catch (err) {
      // Rollback on error
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
  
  // WebSocket event handlers
  function handleNewMessage(data: any) {
    const message: Message = {
      ...data,
      timestamp: new Date(data.timestamp)
    }
    
    // Replace temporary message if it exists
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
    
    // Add new message
    if (!messages.value[message.roomId]) {
      messages.value[message.roomId] = []
    }
    messages.value[message.roomId].push(message)
    
    // Update room's last activity
    const room = rooms.value.find(r => r.id === message.roomId)
    if (room) {
      room.lastActivity = message.timestamp
      room.lastMessage = message
      
      // Increment unread count if not current room
      if (message.roomId !== currentRoomId.value && message.senderId !== currentUser.value?.id) {
        room.unreadCount = (room.unreadCount || 0) + 1
      }
    }
    
    // Show notification if not current room
    if (message.roomId !== currentRoomId.value && message.senderId !== currentUser.value?.id) {
      const sender = users.value[message.senderId]
      notificationStore.addNotification({
        title: `${sender?.displayName || 'Someone'} in ${room?.name || 'Chat'}`,
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
    
    // Remove typing indicator after timeout
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
  
  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    // State
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
    
    // Getters
    currentRoom,
    currentMessages,
    filteredMessages,
    roomsWithUnread,
    currentTypingUsers,
    totalUnreadCount,
    
    // Actions
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

## Component Usage

### Chat Room Component

```vue
<!-- components/ChatRoom.vue -->
<template>
  <div class="chat-room">
    <!-- Header -->
    <div class="chat-header">
      <div class="room-info">
        <h3>{{ chatStore.currentRoom?.name }}</h3>
        <span class="member-count">
          {{ chatStore.currentRoom?.members.length }} members
        </span>
      </div>
      
      <div class="room-actions">
        <button @click="showSearch = !showSearch">
          🔍 Search
        </button>
        <button @click="showMembers = !showMembers">
          👥 Members
        </button>
      </div>
    </div>

    <!-- Search -->
    <div v-if="showSearch" class="search-bar">
      <input 
        v-model="chatStore.searchQuery"
        placeholder="Search messages..."
        class="search-input"
      />
    </div>

    <!-- Messages -->
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
      
      <!-- Typing indicators -->
      <div v-if="chatStore.currentTypingUsers.length > 0" class="typing-indicators">
        <div class="typing-indicator">
          {{ formatTypingUsers(chatStore.currentTypingUsers) }} 
          {{ chatStore.currentTypingUsers.length === 1 ? 'is' : 'are' }} typing...
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container">
      <div v-if="replyingTo" class="reply-preview">
        <span>Replying to {{ chatStore.users[replyingTo.senderId]?.displayName }}</span>
        <button @click="replyingTo = null">✕</button>
      </div>
      
      <div class="message-input">
        <input
          v-model="messageText"
          placeholder="Type a message..."
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
            Send
          </button>
        </div>
      </div>
      
      <!-- Emoji Picker -->
      <EmojiPicker 
        v-if="showEmojiPicker"
        @select="handleEmojiSelect"
        @close="showEmojiPicker = false"
      />
    </div>

    <!-- Members Sidebar -->
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
  
  // Reset typing timeout
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
  if (confirm('Delete this message?')) {
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
  // Implement file upload logic
  console.log('File upload not implemented')
}

function handleScroll() {
  const container = messagesContainer.value
  if (!container) return
  
  // Load more messages when scrolled to top
  if (container.scrollTop === 0 && chatStore.currentMessages.length > 0) {
    const oldestMessage = chatStore.currentMessages[0]
    chatStore.fetchMessages(chatStore.currentRoomId!, 50, oldestMessage.id)
  }
}

function formatTypingUsers(users: User[]): string {
  if (users.length === 1) {
    return users[0].displayName
  } else if (users.length === 2) {
    return `${users[0].displayName} and ${users[1].displayName}`
  } else {
    return `${users[0].displayName} and ${users.length - 1} others`
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Auto-scroll to bottom when new messages arrive
watch(() => chatStore.currentMessages.length, scrollToBottom)

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  handleStopTyping()
})
</script>
```

## Testing

```typescript
// tests/stores/chat.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { WebSocketService } from '@/services/websocket'

// Mock WebSocket
vi.mock('@/services/websocket')

describe('Chat Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should handle new messages correctly', () => {
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

  it('should handle optimistic message updates', async () => {
    const store = useChatStore()
    store.currentRoomId = 'room1'
    store.currentUser = { id: 'user1', username: 'test' }
    
    // Mock WebSocket service
    const mockWs = {
      send: vi.fn()
    }
    store.wsService = mockWs
    
    await store.sendMessage('Test message')
    
    expect(store.messages['room1']).toHaveLength(1)
    expect(store.messages['room1'][0].content).toBe('Test message')
    expect(store.messages['room1'][0].id).toMatch(/^temp-/)
    expect(mockWs.send).toHaveBeenCalledWith('send_message', expect.any(Object))
  })

  it('should extract mentions correctly', () => {
    const store = useChatStore()
    
    store.users = {
      'user1': { id: 'user1', username: 'john' },
      'user2': { id: 'user2', username: 'jane' }
    }
    
    const mentions = store.extractMentions('Hello @john and @jane!')
    
    expect(mentions).toEqual(['user1', 'user2'])
  })

  it('should handle typing indicators', () => {
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

## Key Features

### 1. Real-time Communication
- WebSocket connection with auto-reconnection
- Real-time message delivery
- Typing indicators and user presence
- Connection status monitoring

### 2. Message Management
- Optimistic updates for instant feedback
- Message editing and deletion
- Emoji reactions and mentions
- File attachments support

### 3. User Experience
- Unread message counts
- Push notifications
- Message search and history
- Responsive design

### 4. Performance
- Message pagination and lazy loading
- Efficient state management
- Memory optimization for large chat histories

### 5. Reliability
- Offline message queuing
- Error handling and recovery
- Message delivery confirmation

This real-time chat application demonstrates how to build complex, interactive applications with Pinia while handling real-time data, WebSocket connections, and providing a smooth user experience.