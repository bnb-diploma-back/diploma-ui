<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { auth } from '@/stores/auth'

const studentId = auth.studentId
const messages = ref([])
const input = ref('')
const sending = ref(false)
const connected = ref(false)
const chatContainer = ref(null)

let stompClient = null

const suggestions = [
  'How should I prepare for my midterm?',
  'What career fits me best?',
  'Plan my study week',
  'What are my weakest subjects?',
]

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function connect() {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8070/ws/chat'),
    reconnectDelay: 5000,
    onConnect: () => {
      connected.value = true

      stompClient.subscribe('/user/queue/chat', (message) => {
        const response = JSON.parse(message.body)
        const lastMsg = messages.value[messages.value.length - 1]

        switch (response.type) {
          case 'CHUNK':
            if (lastMsg && lastMsg.role === 'ai' && lastMsg.streaming) {
              lastMsg.content += response.content
            } else {
              messages.value.push({
                role: 'ai',
                content: response.content,
                streaming: true,
                timestamp: response.timestamp,
              })
            }
            scrollToBottom()
            break

          case 'DONE':
            if (lastMsg && lastMsg.role === 'ai') {
              lastMsg.streaming = false
            }
            sending.value = false
            scrollToBottom()
            break

          case 'ERROR':
            messages.value.push({
              role: 'error',
              content: response.content,
              timestamp: response.timestamp,
            })
            sending.value = false
            scrollToBottom()
            break
        }
      })
    },
    onDisconnect: () => {
      connected.value = false
    },
    onStompError: () => {
      connected.value = false
    },
  })

  stompClient.activate()
}

function sendMessage(text) {
  const msg = (text || input.value).trim()
  if (!msg || !stompClient || !connected.value) return

  messages.value.push({
    role: 'user',
    content: msg,
    timestamp: new Date().toISOString(),
  })
  input.value = ''
  sending.value = true
  scrollToBottom()

  stompClient.publish({
    destination: '/app/chat',
    body: JSON.stringify({
      studentId: studentId.value,
      message: msg,
    }),
  })
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(connect)

onUnmounted(() => {
  if (stompClient) {
    stompClient.deactivate()
  }
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <div class="px-8 py-5 border-b border-border bg-surface shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 class="font-semibold">AI Study Assistant</h1>
            <p class="text-xs text-text-secondary">Knows your courses, grades, and goals</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :class="connected ? 'bg-success' : 'bg-danger'"></span>
          <span class="text-xs text-text-secondary">{{ connected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto px-8 py-6 space-y-4">
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-1">Ask me anything</h2>
        <p class="text-text-secondary text-sm text-center max-w-md mb-6">
          I know your courses, grades, and career goals. Ask about study plans, exam prep, or career advice.
        </p>
        <div class="flex flex-wrap gap-2 justify-center max-w-lg">
          <button
            v-for="s in suggestions"
            :key="s"
            @click="sendMessage(s)"
            class="px-4 py-2 bg-surface border border-border rounded-xl text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Message bubbles -->
      <template v-for="(msg, i) in messages" :key="i">
        <!-- User message -->
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div class="max-w-[70%] bg-primary text-white px-5 py-3 rounded-2xl rounded-br-md">
            <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
          </div>
        </div>

        <!-- AI message -->
        <div v-else-if="msg.role === 'ai'" class="flex justify-start gap-3">
          <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="max-w-[70%] bg-surface border border-border px-5 py-3 rounded-2xl rounded-bl-md shadow-sm">
            <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
            <span v-if="msg.streaming" class="inline-block w-1.5 h-4 bg-primary/60 rounded-sm animate-pulse ml-0.5 align-middle"></span>
          </div>
        </div>

        <!-- Error message -->
        <div v-else-if="msg.role === 'error'" class="flex justify-start gap-3">
          <div class="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
            <svg class="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="max-w-[70%] bg-danger/5 border border-danger/20 px-5 py-3 rounded-2xl rounded-bl-md">
            <p class="text-sm text-danger">{{ msg.content }}</p>
          </div>
        </div>
      </template>

      <!-- Typing indicator -->
      <div v-if="sending && (!messages.length || messages[messages.length - 1].role !== 'ai')" class="flex justify-start gap-3">
        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div class="bg-surface border border-border px-5 py-3 rounded-2xl rounded-bl-md shadow-sm">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="px-8 py-4 border-t border-border bg-surface shrink-0">
      <div class="flex gap-3">
        <input
          v-model="input"
          @keydown="handleKeydown"
          :disabled="!connected || sending"
          placeholder="Ask about your courses, exams, or career..."
          class="flex-1 px-5 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
        />
        <button
          @click="sendMessage()"
          :disabled="!input.trim() || !connected || sending"
          class="px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>