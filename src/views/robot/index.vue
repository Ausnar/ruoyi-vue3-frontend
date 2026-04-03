<template>
  <div ref="robotPageRef" class="robot-page" :style="robotPageStyle">
    <div class="robot-layout">
      <aside class="conversation-panel">
        <div class="panel-header panel-header-side">
          <div class="header-copy header-copy-side">
            <h3>智能问答</h3>
            <p>查看近期记录，继续当前问题</p>
          </div>
          <el-button class="new-chat-btn" type="primary" plain @click="startNewConversation">
            <el-icon><RefreshRight /></el-icon>
            新建会话
          </el-button>
        </div>

        <div class="conversation-scroll">
          <div v-if="conversationLoading" class="side-placeholder">正在加载历史会话...</div>
          <div v-else-if="!conversations.length" class="side-placeholder">暂无历史会话，开始提问后会自动保留最近记录</div>
          <button
            v-for="item in conversations"
            :key="item.conversationId"
            type="button"
            class="conversation-item"
            :class="{ active: item.conversationId === activeConversationId }"
            @click="openConversation(item.conversationId)"
          >
            <div class="conversation-main">
              <div class="conversation-title">{{ item.title || '未命名会话' }}</div>
              <div class="conversation-preview">{{ item.lastMessagePreview || '暂无内容' }}</div>
              <div class="conversation-meta">
                <span>{{ item.messageCount || 0 }} 条消息</span>
                <span>{{ formatListTime(item.updateTime) }}</span>
              </div>
            </div>
            <el-button
              class="delete-btn"
              type="danger"
              link
              @click.stop="removeConversation(item)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </button>
        </div>
      </aside>

      <section class="chat-panel">
        <div class="chat-header">
          <div class="header-copy">
            <h3>{{ currentConversationTitle }}</h3>
            <p>{{ currentConversationDesc }}</p>
          </div>
          <div class="header-status">
            <span class="status-chip" :class="{ active: !!activeConversationId }">
              {{ activeConversationId ? '会话进行中' : '准备开始' }}
            </span>
          </div>
        </div>

        <div class="message-list" ref="messageListRef">
          <div v-if="!messages.length && !loading" class="empty-state">
            <div class="empty-icon">
              <el-icon size="42"><ChatDotRound /></el-icon>
            </div>
            <h4>你好，我是智能问答助手</h4>
            <p>你可以围绕公司资料、方案撰写、汇报整理等内容持续提问，我会尽量给出清晰、完整的答复。</p>
            <div class="quick-prompts">
              <button
                v-for="prompt in quickPrompts"
                :key="prompt"
                type="button"
                class="prompt-chip"
                @click="applyPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>

          <div
            v-for="(msg, index) in messages"
            :key="msg.id"
            class="message-item"
            :class="[msg.role, { error: msg.status === 'error' }]"
          >
            <div class="avatar">
              <el-icon v-if="msg.role === 'user'"><User /></el-icon>
              <el-icon v-else><Service /></el-icon>
            </div>

            <div class="message-main">
              <div class="message-top">
                <span class="role-name">{{ msg.role === 'user' ? '你' : '智能助手' }}</span>
                <span v-if="msg.role === 'assistant' && msg.answerType" class="meta-chip">
                  {{ formatAnswerMeta(msg) }}
                </span>
                <span v-if="msg.status === 'error'" class="meta-chip danger">未完成</span>
              </div>

              <div
                class="message-text"
                :class="{ 'assistant-rich': msg.role === 'assistant' }"
                v-html="msg.role === 'assistant' ? renderAssistantMessage(msg.content) : renderUserMessage(msg.content)"
              ></div>

              <div class="message-footer">
                <span class="message-time">{{ msg.time }}</span>
                <span v-if="msg.elapsedMs" class="message-time">耗时 {{ formatDuration(msg.elapsedMs) }}</span>
                <div class="message-actions">
                  <el-button
                    v-if="msg.role === 'assistant' && msg.content"
                    type="primary"
                    link
                    @click="copyMessage(msg.content)"
                  >
                    <el-icon><DocumentCopy /></el-icon>
                    复制
                  </el-button>
                  <el-button
                    v-if="msg.role === 'assistant' && canRetryFromIndex(index)"
                    type="primary"
                    link
                    @click="retryFrom(index)"
                  >
                    <el-icon><RefreshRight /></el-icon>
                    重试
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="loading" class="message-item assistant pending">
            <div class="avatar">
              <el-icon><Service /></el-icon>
            </div>
            <div class="message-main">
              <div class="message-top">
                <span class="role-name">智能助手</span>
                <span class="meta-chip active">处理中</span>
              </div>
              <div class="message-text typing">
                <span class="typing-line">{{ loadingHint }}</span>
                <div class="typing-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>
              <div class="message-footer">
                <span class="message-time">已等待 {{ formatDuration(loadingElapsedMs) }}</span>
                <span class="message-time">内容较长时生成会稍慢，请稍候查看结果</span>
              </div>
            </div>
          </div>
        </div>

        <div class="composer">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="4"
            resize="none"
            placeholder="请输入问题，按 Enter 发送，Shift + Enter 换行"
            @keydown.enter="handleSendMessage"
          />
          <div class="composer-footer">
            <div class="composer-tip">
              系统会自动保留会话记录，方便后续继续查看与追问。
            </div>
            <el-button
              type="primary"
              class="send-btn"
              :loading="loading"
              :disabled="!inputMessage.trim()"
              @click="submitCurrentMessage"
            >
              <el-icon><Promotion /></el-icon>
              发送
            </el-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  Delete,
  DocumentCopy,
  Promotion,
  RefreshRight,
  Service,
  User
} from '@element-plus/icons-vue'
import { marked } from 'marked'
import {
  deleteConversation,
  getConversationDetail,
  getConversationList,
  sendMessage
} from '@/api/robot'

const ACTIVE_KEY = 'robot_active_conversation_id'
const DRAFT_KEY = 'robot_draft_message'
const quickPrompts = [
  '生成公司 BP 提纲',
  '整理一版路演 PPT 大纲',
  '总结公司的核心成员和优势',
  '整理成适合汇报的 Markdown'
]

const renderer = new marked.Renderer()
renderer.link = (...args) => {
  const token = typeof args[0] === 'object' && args[0] !== null
    ? args[0]
    : { href: args[0], title: args[1], text: args[2] }
  const text = token.tokens?.map((item) => item.raw || '').join('') || token.text || token.href || '链接'
  const safeHref = sanitizeUrl(token.href)
  const safeTitle = token.title ? ` title="${escapeHtml(token.title)}"` : ''
  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${safeTitle}>${escapeHtml(text)}</a>`
}
marked.setOptions({
  breaks: true,
  gfm: true,
  renderer
})

const conversations = ref([])
const currentConversation = ref(null)
const activeConversationId = ref(localStorage.getItem(ACTIVE_KEY) || '')
const messages = ref([])
const inputMessage = ref(localStorage.getItem(DRAFT_KEY) || '')
const loading = ref(false)
const conversationLoading = ref(false)
const detailLoading = ref(false)
const messageListRef = ref(null)
const robotPageRef = ref(null)
const loadingElapsedMs = ref(0)
const loadingStartedAt = ref(0)
const pageHeight = ref('calc(100vh - 108px)')
let loadingTimer = null

const currentConversationTitle = computed(() => {
  return currentConversation.value?.title || (activeConversationId.value ? '当前会话' : '智能问答')
})

const currentConversationDesc = computed(() => {
  if (activeConversationId.value && currentConversation.value) {
    return `当前会话已保存 ${currentConversation.value.messageCount || 0} 条消息，可继续围绕当前主题提问`
  }
  return '开始提问后，系统会自动创建会话并保留记录'
})

const loadingHint = computed(() => {
  if (loadingElapsedMs.value >= 90000) return '正在整理较长内容，请再稍候片刻'
  if (loadingElapsedMs.value >= 30000) return '正在继续生成，请稍候'
  return '正在生成回复'
})

const robotPageStyle = computed(() => ({
  height: pageHeight.value
}))

onMounted(async () => {
  window.addEventListener('resize', updatePageHeight)
  await initializePage()
  await nextTick()
  updatePageHeight()
})

onBeforeUnmount(() => {
  stopLoadingTimer()
  window.removeEventListener('resize', updatePageHeight)
})

watch(inputMessage, (value) => {
  localStorage.setItem(DRAFT_KEY, value)
})

watch(activeConversationId, (value) => {
  if (value) {
    localStorage.setItem(ACTIVE_KEY, value)
  } else {
    localStorage.removeItem(ACTIVE_KEY)
  }
})

watch(
  () => [messages.value.length, loading.value],
  () => scrollToBottom()
)

function updatePageHeight() {
  const page = robotPageRef.value
  if (!page || typeof window === 'undefined') return

  const rect = page.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const bottomGap = 12
  const availableHeight = Math.max(560, Math.floor(viewportHeight - rect.top - bottomGap))
  pageHeight.value = `${availableHeight}px`
}

async function initializePage() {
  await loadConversationList()
  if (activeConversationId.value && conversations.value.some((item) => item.conversationId === activeConversationId.value)) {
    await openConversation(activeConversationId.value)
    return
  }
  if (conversations.value.length) {
    await openConversation(conversations.value[0].conversationId)
    return
  }
  startNewConversation(false)
}

async function loadConversationList() {
  conversationLoading.value = true
  try {
    const response = await getConversationList()
    const list = Array.isArray(response.data) ? response.data : []
    conversations.value = list.map((item) => ({
      conversationId: item.conversationId,
      title: item.title || '未命名会话',
      lastMessagePreview: item.lastMessagePreview || '',
      messageCount: Number(item.messageCount || 0),
      updateTime: item.updateTime || item.createTime || ''
    }))
  } catch (error) {
    ElMessage.error(error?.message || '加载历史会话失败')
  } finally {
    conversationLoading.value = false
  }
}

async function openConversation(conversationId) {
  if (!conversationId || detailLoading.value) return
  detailLoading.value = true
  try {
    const response = await getConversationDetail(conversationId)
    const data = response.data || {}
    currentConversation.value = data.conversation || null
    activeConversationId.value = conversationId
    messages.value = Array.isArray(data.messages)
      ? [...data.messages]
          .sort((a, b) => compareMessageOrder(a, b))
          .map((item) => buildMessage({
          id: item.messageId,
          role: item.role,
          content: item.content,
          time: formatMessageTime(item.createTime),
          status: item.status || 'completed',
          answerType: item.answerType,
          responseType: item.responseType,
          elapsedMs: Number(item.elapsedMs || 0)
        }))
      : []
  } catch (error) {
    ElMessage.error(error?.message || '加载会话详情失败')
  } finally {
    detailLoading.value = false
    scrollToBottom()
  }
}

function startNewConversation(showMessage = true) {
  activeConversationId.value = ''
  currentConversation.value = null
  messages.value = []
  if (showMessage) {
    ElMessage.success('已开始新会话')
  }
}

function applyPrompt(prompt) {
  inputMessage.value = prompt
}

function handleSendMessage(event) {
  if (event.shiftKey) return
  event.preventDefault()
  submitCurrentMessage()
}

async function submitCurrentMessage() {
  const content = inputMessage.value.trim()
  if (!content || loading.value) return

  inputMessage.value = ''
  messages.value.push(buildMessage({
    role: 'user',
    content,
    time: formatMessageTime(new Date())
  }))

  loading.value = true
  startLoadingTimer()

  try {
    const response = await sendMessage({
      message: content,
      conversationId: activeConversationId.value || ''
    })
    const conversationId = response.data?.conversationId || activeConversationId.value
    await loadConversationList()

    if (conversationId) {
      await openConversation(conversationId)
    } else {
      messages.value.push(buildMessage({
        role: 'assistant',
        content: response.data?.reply || response.msg || '抱歉，我暂时无法回答这个问题。',
        answerType: response.data?.answerType,
        responseType: response.data?.responseType,
        elapsedMs: Number(response.data?.elapsedMs || 0),
        status: response.data?.status || 'completed'
      }))
    }
  } catch (error) {
    const message = error?.message || '请求失败，请稍后重试'
    messages.value.push(buildMessage({
      role: 'assistant',
      content: `请求失败：${message}`,
      status: 'error',
      answerType: 'error',
      responseType: 'text'
    }))
    ElMessage.error(message)
  } finally {
    loading.value = false
    stopLoadingTimer()
    scrollToBottom()
  }
}

function canRetryFromIndex(index) {
  if (loading.value) return false
  for (let i = index; i >= 0; i -= 1) {
    if (messages.value[i].role === 'user') {
      return true
    }
  }
  return false
}

function retryFrom(index) {
  for (let i = index; i >= 0; i -= 1) {
    if (messages.value[i].role === 'user') {
      inputMessage.value = messages.value[i].content
      submitCurrentMessage()
      return
    }
  }
}

async function removeConversation(item) {
  try {
    await ElMessageBox.confirm(`确认删除会话“${item.title || '未命名会话'}”吗？`, '删除会话', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteConversation(item.conversationId)
    ElMessage.success('会话已删除')
    await loadConversationList()

    if (item.conversationId === activeConversationId.value) {
      if (conversations.value.length) {
        await openConversation(conversations.value[0].conversationId)
      } else {
        startNewConversation(false)
      }
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除会话失败')
  }
}

async function copyMessage(content) {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请检查浏览器权限')
  }
}

function buildMessage(payload) {
  return {
    id: payload.id || `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    role: payload.role,
    content: payload.content || '',
    time: payload.time || formatMessageTime(new Date()),
    status: payload.status || 'completed',
    answerType: payload.answerType || '',
    responseType: payload.responseType || '',
    elapsedMs: payload.elapsedMs || 0
  }
}

function compareMessageOrder(a, b) {
  const timeA = parseMessageTimestamp(a?.createTime)
  const timeB = parseMessageTimestamp(b?.createTime)
  if (timeA !== timeB) return timeA - timeB

  const idA = Number(a?.messageId || 0)
  const idB = Number(b?.messageId || 0)
  return idA - idB
}

function parseMessageTimestamp(value) {
  if (!value) return 0
  const date = new Date(String(value).replace(/-/g, '/'))
  const timestamp = date.getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function startLoadingTimer() {
  stopLoadingTimer()
  loadingStartedAt.value = Date.now()
  loadingElapsedMs.value = 0
  loadingTimer = window.setInterval(() => {
    loadingElapsedMs.value = Date.now() - loadingStartedAt.value
  }, 1000)
}

function stopLoadingTimer() {
  if (loadingTimer) {
    window.clearInterval(loadingTimer)
    loadingTimer = null
  }
  loadingElapsedMs.value = 0
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function formatAnswerMeta(message) {
  if (message.status === 'timeout' || message.answerType === 'timeout') return '等待时间较长'
  if (message.responseType === 'markdown' || message.responseType === 'card') return '已整理'
  return '已回复'
}

function formatDuration(ms) {
  const totalSeconds = Math.max(1, Math.round(Number(ms || 0) / 1000))
  if (totalSeconds < 60) return `${totalSeconds} 秒`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分钟`
}

function formatListTime(value) {
  if (!value) return '刚刚'
  return String(value).replace('T', ' ').slice(0, 16)
}

function formatMessageTime(value) {
  if (!value) return '--:--'
  const date = value instanceof Date ? value : new Date(String(value).replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return String(value).slice(11, 16) || String(value)
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

function renderUserMessage(text) {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

function renderAssistantMessage(text) {
  const content = (text || '').trim()
  if (!content) return ''

  const fencedMd = content.match(/^```(?:md|markdown)?\s*([\s\S]*?)\s*```$/i)
  const markdown = fencedMd ? fencedMd[1] : content
  const safeMarkdown = escapeHtml(markdown)
  return marked.parse(safeMarkdown)
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return '#'
  if (/^javascript:/i.test(normalized)) return '#'
  return escapeHtml(normalized)
}
</script>

<style scoped>
.robot-page {
  height: calc(100vh - 108px);
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(64, 158, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #f6fbff 0%, #eef3f8 100%);
}

.robot-layout {
  height: 100%;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.conversation-panel,
.chat-panel {
  height: 100%;
  min-height: 0;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(205, 218, 229, 0.9);
  border-radius: 20px;
  box-shadow: 0 22px 60px rgba(31, 45, 61, 0.08);
}

.conversation-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header,
.chat-header {
  position: relative;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(221, 230, 238, 0.9);
  background:
    radial-gradient(circle at top right, rgba(64, 158, 255, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(250, 252, 255, 0.98), rgba(255, 255, 255, 0.94));
  backdrop-filter: blur(10px);
}

.panel-header h3 {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1f2f41;
}

.panel-header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #738293;
  line-height: 1.6;
  max-width: 520px;
}

.panel-header {
  padding: 22px 24px 20px;
  min-height: 150px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.panel-header-side {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(252, 253, 255, 0.96));
}

.header-copy {
  min-width: 0;
}

.header-copy-side h3 {
  font-size: 20px;
  margin-top: 0;
}

.header-copy-side p {
  max-width: none;
  margin-top: 10px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7b8a9a;
}

.section-kicker::before {
  content: '';
  width: 18px;
  height: 1px;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.75), rgba(64, 158, 255, 0.15));
}

.new-chat-btn {
  width: 100%;
  height: 42px;
  border-radius: 14px;
  justify-content: center;
  font-weight: 600;
  background: rgba(248, 251, 255, 0.92);
  border-color: rgba(146, 185, 228, 0.95);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.conversation-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  background: linear-gradient(180deg, rgba(250, 252, 254, 0.52), rgba(255, 255, 255, 0.96));
}

.side-placeholder {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #7f8c9a;
  line-height: 1.8;
  padding: 12px;
}

.conversation-item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid rgba(230, 236, 242, 0.95);
  margin-bottom: 12px;
  padding: 16px 16px 15px;
  text-align: left;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(31, 45, 61, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.conversation-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.18s ease;
}

.conversation-item:hover,
.conversation-item.active {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(248, 251, 255, 0.98));
  border-color: rgba(207, 222, 236, 0.95);
  box-shadow: 0 14px 28px rgba(31, 45, 61, 0.07);
  transform: translateY(-1px);
}

.conversation-item.active::before {
  background: linear-gradient(180deg, #4d9fff, #2a7be7);
}

.conversation-main {
  min-width: 0;
  flex: 1;
}

.conversation-title {
  font-size: 14px;
  font-weight: 600;
  color: #203244;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.conversation-preview {
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.7;
  color: #708091;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.conversation-meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #8a98a8;
}

.delete-btn {
  flex-shrink: 0;
  margin-top: 1px;
  opacity: 0;
  color: #e37a7a;
  transition: opacity 0.18s ease, color 0.18s ease;
}

.conversation-item:hover .delete-btn,
.conversation-item.active .delete-btn {
  opacity: 0.8;
}

.conversation-item:hover .delete-btn:hover,
.conversation-item.active .delete-btn:hover {
  opacity: 1;
  color: #dd6161;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 10px 20px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.chat-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: #1f2f41;
}

.chat-header p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #7c8a99;
  line-height: 1.45;
  max-width: 520px;
}

.status-chip,
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(235, 240, 245, 0.9);
  color: #526171;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(220, 228, 236, 0.9);
}

.status-chip.active,
.meta-chip.active {
  background: rgba(64, 158, 255, 0.1);
  color: #1d6fdc;
  border-color: rgba(64, 158, 255, 0.16);
}

.meta-chip.danger {
  background: rgba(245, 108, 108, 0.12);
  color: #dd6161;
  border-color: rgba(245, 108, 108, 0.16);
}

.status-chip::before,
.meta-chip::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
  background:
    linear-gradient(180deg, rgba(249, 251, 253, 0.7), rgba(255, 255, 255, 0.96) 18%, rgba(255, 255, 255, 1));
}

.empty-state {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #5e6c7a;
}

.empty-icon {
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.18), rgba(103, 194, 58, 0.16));
  color: #2f78dd;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.empty-state h4 {
  margin: 18px 0 10px;
  font-size: 22px;
  color: #243447;
}

.empty-state p {
  max-width: 620px;
  margin: 0;
  line-height: 1.8;
}

.quick-prompts {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.prompt-chip {
  border: none;
  padding: 10px 16px;
  border-radius: 999px;
  background: #ffffff;
  color: #33516f;
  box-shadow: 0 8px 24px rgba(31, 45, 61, 0.08);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.prompt-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(31, 45, 61, 0.12);
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 22px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #fff;
  box-shadow: 0 8px 20px rgba(31, 45, 61, 0.12);
}

.user .avatar {
  background: linear-gradient(135deg, #409eff, #1f7ae0);
}

.assistant .avatar {
  background: linear-gradient(135deg, #46b26e, #2a9c78);
}

.message-main {
  max-width: min(860px, calc(100% - 60px));
}

.user .message-main {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-top,
.message-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.message-top {
  margin-bottom: 6px;
}

.message-footer {
  margin-top: 10px;
}

.role-name,
.message-time {
  font-size: 12px;
  color: #8391a0;
  font-weight: 500;
}

.message-text {
  padding: 16px 18px;
  border-radius: 20px;
  line-height: 1.85;
  font-size: 14px;
  word-break: break-word;
  box-shadow: 0 14px 34px rgba(31, 45, 61, 0.06);
}

.user .message-text {
  background:
    linear-gradient(135deg, #3b98f8, #287fe8 58%, #1f73dc);
  color: #fff;
  border-top-right-radius: 8px;
  box-shadow: 0 16px 32px rgba(38, 121, 220, 0.22);
}

.assistant .message-text {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 252, 255, 0.96));
  color: #243447;
  border: 1px solid rgba(224, 232, 240, 0.95);
  border-top-left-radius: 8px;
  box-shadow: 0 18px 36px rgba(31, 45, 61, 0.05);
}

.message-item.error .message-text {
  border-color: rgba(245, 108, 108, 0.25);
}

.assistant-rich :deep(h1),
.assistant-rich :deep(h2),
.assistant-rich :deep(h3),
.assistant-rich :deep(h4) {
  margin: 10px 0 6px;
  color: #203244;
}

.assistant-rich :deep(p) {
  margin: 8px 0;
}

.assistant-rich :deep(ul),
.assistant-rich :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.assistant-rich :deep(li) {
  margin: 4px 0;
}

.assistant-rich :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.assistant-rich :deep(th),
.assistant-rich :deep(td) {
  border: 1px solid #dde6ee;
  padding: 8px 10px;
  text-align: left;
}

.assistant-rich :deep(th) {
  background: #f6f9fc;
}

.assistant-rich :deep(code) {
  padding: 2px 6px;
  border-radius: 6px;
  background: #eef3f8;
  color: #b5482d;
}

.assistant-rich :deep(pre) {
  margin: 10px 0;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(180deg, #18222d, #111a24);
  color: #f5f7fa;
  overflow-x: auto;
}

.assistant-rich :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

.assistant-rich :deep(a) {
  color: #1f7ae0;
  text-decoration: none;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing {
  min-width: 320px;
}

.typing-line {
  display: block;
  margin-bottom: 10px;
  color: #506272;
}

.typing-dots {
  display: inline-flex;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6aa8ff;
  animation: pulse 1.2s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.15s;
}

.dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes pulse {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.composer {
  padding: 18px 24px 24px;
  border-top: 1px solid rgba(225, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.94);
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
}

.composer-tip {
  font-size: 12px;
  color: #7d8b99;
  line-height: 1.6;
  max-width: 540px;
}

.send-btn {
  min-width: 112px;
  height: 40px;
  border-radius: 12px;
}

@media (max-width: 1024px) {
  .robot-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 240px minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .robot-page {
    padding: 0;
  }

  .robot-layout {
    gap: 0;
    grid-template-rows: 220px minmax(0, 1fr);
    height: calc(100vh - 84px);
  }

  .conversation-panel,
  .chat-panel {
    border-radius: 0;
  }

  .panel-header,
  .chat-header,
  .composer,
  .message-list {
    padding-left: 16px;
    padding-right: 16px;
  }

  .panel-header,
  .chat-header,
  .composer-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .message-main {
    max-width: calc(100% - 52px);
  }

  .typing {
    min-width: 0;
  }
}
</style>
