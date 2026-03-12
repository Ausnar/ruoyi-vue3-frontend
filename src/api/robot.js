import request from '@/utils/request'

// 发送消息获取AI回复
export function sendMessage(data) {
  return request({
    url: '/robot/chat',
    method: 'post',
    data: data
  })
}