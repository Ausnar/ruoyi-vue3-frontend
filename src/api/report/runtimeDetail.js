import request from '@/utils/request'

export function listRuntimeDetail(query) {
  return request({
    url: '/report/runtime-detail/list',
    method: 'get',
    params: query
  })
}

export function listRuntimeDetailFirePoints(query) {
  return request({
    url: '/report/runtime-detail/fire-points',
    method: 'get',
    params: query
  })
}

export function listRuntimeDetailDevices(query) {
  return request({
    url: '/report/runtime-detail/devices',
    method: 'get',
    params: query
  })
}
