import request from '@/utils/request'

export function listVisitApproveConfig(query) {
  return request({
    url: '/visit/approve-config/list',
    method: 'get',
    params: query
  })
}

export function getVisitApproveConfig(configId) {
  return request({
    url: '/visit/approve-config/' + configId,
    method: 'get'
  })
}

export function addVisitApproveConfig(data) {
  return request({
    url: '/visit/approve-config',
    method: 'post',
    data
  })
}

export function updateVisitApproveConfig(data) {
  return request({
    url: '/visit/approve-config',
    method: 'put',
    data
  })
}

export function delVisitApproveConfig(configId) {
  return request({
    url: '/visit/approve-config/' + configId,
    method: 'delete'
  })
}

export function listVisitApproveRoleOptions() {
  return request({
    url: '/visit/approve-config/role-options',
    method: 'get'
  })
}
