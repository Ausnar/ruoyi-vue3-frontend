import request from '@/utils/request'

export function listGateway(query) {
  return request({
    url: '/manage/gateway/list',
    method: 'get',
    params: query
  })
}

export function getGateway(gatewayId) {
  return request({
    url: '/manage/gateway/' + gatewayId,
    method: 'get'
  })
}
