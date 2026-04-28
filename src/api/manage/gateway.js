import request from '@/utils/request'

// 查询网关信息列表
export function listGateway(query) {
  return request({
    url: '/manage/gateway/list',
    method: 'get',
    params: query
  })
}

// 查询网关信息详情
export function getGateway(gatewayId) {
  return request({
    url: '/manage/gateway/' + gatewayId,
    method: 'get'
  })
}
