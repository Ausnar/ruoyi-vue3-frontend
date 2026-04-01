import request from '@/utils/request'

// 发送消息获取AI回复
export function sendMessage(data) {
  return request({
    url: '/robot/chat',
    method: 'post',
    data: data,
    timeout: 300000  // 智能问答特殊超时：180秒，匹配后端重试等待时间
  })
}