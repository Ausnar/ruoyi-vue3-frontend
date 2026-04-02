import request from '@/utils/request'

export function sendMessage(data) {
  return request({
    url: '/robot/chat',
    method: 'post',
    data,
    timeout: 300000,
    headers: {
      repeatSubmit: false
    }
  })
}

export function getConversationList() {
  return request({
    url: '/robot/conversations',
    method: 'get'
  })
}

export function getConversationDetail(conversationId) {
  return request({
    url: `/robot/conversations/${conversationId}`,
    method: 'get'
  })
}

export function deleteConversation(conversationId) {
  return request({
    url: `/robot/conversations/${conversationId}`,
    method: 'delete'
  })
}