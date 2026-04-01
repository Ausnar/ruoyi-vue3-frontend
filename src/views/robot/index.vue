<template>
  <div class="robot-container">
    <div class="chat-container">
      <div class="chat-header">
        <h3>智能问答助手</h3>
        <el-button type="primary" link @click="clearHistory">
          <el-icon><Delete /></el-icon>
          清空对话
        </el-button>
      </div>

      <div class="message-list" ref="messageListRef">
        <div v-if="messages.length === 0" class="empty-tip">
          <el-icon size="60"><ChatDotRound /></el-icon>
          <p>你好，我是智能问答助手，有什么可以帮你？</p>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-item', msg.role]"
        >
          <div class="avatar">
            <el-icon v-if="msg.role === 'user'"><User /></el-icon>
            <el-icon v-else><Service /></el-icon>
          </div>
          <div class="message-content">
            <div
              class="message-text"
              :class="{ 'assistant-rich': msg.role === 'assistant' }"
              v-html="msg.role === 'assistant' ? renderAssistantMessage(msg.content) : escapeHtml(msg.content)"
            ></div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>

        <div v-if="loading" class="message-item assistant">
          <div class="avatar">
            <el-icon><Service /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-text typing">
              <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="请输入问题，按 Enter 发送，Shift+Enter 换行"
          resize="none"
          @keydown.enter="handleSendMessage"
        />
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!inputMessage.trim()"
          @click="handleSendMessage"
        >
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, ChatDotRound, User, Service, Promotion } from '@element-plus/icons-vue'
import { sendMessage } from '@/api/robot'
import { marked } from 'marked'

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messageListRef = ref(null)
const conversationId = ref(null)

onMounted(() => {
  const history = localStorage.getItem('robot_messages')
  const convId = localStorage.getItem('robot_conversation_id')
  if (history) {
    try {
      messages.value = JSON.parse(history)
    } catch (e) {
      messages.value = []
    }
  }
  if (convId) {
    conversationId.value = convId
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function escapeHtml(text) {
  const input = text || ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>')
}

function renderAssistantMessage(text) {
  const content = (text || '').trim()
  if (!content) return ''

  // 兼容 Coze 常见输出：```md ... ``` 包裹 markdown 正文
  const fencedMd = content.match(/^```(?:md|markdown)?\s*([\s\S]*?)\s*```$/i)
  const markdown = fencedMd ? fencedMd[1] : content
  return marked.parse(markdown)
}

function handleSendMessage(event) {
  if (event.shiftKey) return
  event.preventDefault()

  const content = inputMessage.value.trim()
  if (!content || loading.value) return

  messages.value.push({
    role: 'user',
    content,
    time: new Date().toLocaleTimeString()
  })

  inputMessage.value = ''
  scrollToBottom()
  saveHistory()

  loading.value = true
  sendMessage({
    message: content,
    conversationId: conversationId.value || ''
  })
    .then(response => {
      const data = response.data || {}
      messages.value.push({
        role: 'assistant',
        content: data.reply || response.msg || '抱歉，我暂时无法回答这个问题。',
        time: new Date().toLocaleTimeString()
      })

      if (data.conversationId) {
        conversationId.value = data.conversationId
        localStorage.setItem('robot_conversation_id', data.conversationId)
      }

      saveHistory()
      scrollToBottom()
    })
    .catch(error => {
      ElMessage.error(error.message || '请求失败，请稍后重试')
    })
    .finally(() => {
      loading.value = false
    })
}

function saveHistory() {
  const keepMessages = messages.value.slice(-50)
  localStorage.setItem('robot_messages', JSON.stringify(keepMessages))
}

function clearHistory() {
  messages.value = []
  conversationId.value = null
  localStorage.removeItem('robot_messages')
  localStorage.removeItem('robot_conversation_id')
  ElMessage.success('对话已清空')
}
</script>

<style scoped>
.robot-container {
  height: 100%;
  padding: 0;
}

.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.chat-header h3 {
  margin: 0;
  color: #303133;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 300px;
}

.empty-tip {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
}

.empty-tip p {
  margin-top: 20px;
  font-size: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user .avatar {
  background: #409eff;
  color: #fff;
}

.assistant .avatar {
  background: #67c23a;
  color: #fff;
}

.message-content {
  max-width: 70%;
  margin: 0 10px;
}

.user .message-content {
  text-align: right;
}

.message-text {
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.assistant-rich {
  white-space: normal;
}

.user .message-text {
  background: #409eff;
  color: #fff;
}

.assistant .message-text {
  background: #f5f7fa;
  color: #303133;
}

.assistant-rich :deep(h1),
.assistant-rich :deep(h2),
.assistant-rich :deep(h3) {
  margin: 10px 0 6px;
  font-weight: 600;
}

.assistant-rich :deep(p) {
  margin: 8px 0;
}

.assistant-rich :deep(ul),
.assistant-rich :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.assistant-rich :deep(li) {
  margin: 4px 0;
}

.assistant-rich :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.assistant-rich :deep(pre) {
  background: #2d2d2d;
  color: #fff;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.assistant-rich :deep(pre code) {
  background: transparent;
  padding: 0;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.user .message-time {
  text-align: right;
}

.typing {
  display: flex;
  align-items: center;
}

.typing .dot {
  animation: dot 1s infinite;
  font-weight: bold;
}

.typing .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0; }
}

.input-area {
  display: flex;
  align-items: flex-end;
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  gap: 10px;
}

.input-area .el-textarea {
  flex: 1;
}

.input-area .el-button {
  height: 72px;
  padding: 0 20px;
}
</style>
