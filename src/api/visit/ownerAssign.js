import request from '@/utils/request'

export function listOwnerAssign(query) {
  return request({
    url: '/visit/owner-assign/list',
    method: 'get',
    params: query
  })
}

export function getOwnerAssign(assignId) {
  return request({
    url: '/visit/owner-assign/' + assignId,
    method: 'get'
  })
}

export function addOwnerAssign(data) {
  return request({
    url: '/visit/owner-assign',
    method: 'post',
    data
  })
}

export function updateOwnerAssign(data) {
  return request({
    url: '/visit/owner-assign',
    method: 'put',
    data
  })
}

export function delOwnerAssign(assignId) {
  return request({
    url: '/visit/owner-assign/' + assignId,
    method: 'delete'
  })
}

export function listOwnerAssignContractOptions() {
  return request({
    url: '/visit/owner-assign/contract-options',
    method: 'get'
  })
}
