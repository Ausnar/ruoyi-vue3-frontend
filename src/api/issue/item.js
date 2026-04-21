import request from '@/utils/request'

export function listIssueItem(query) {
  return request({
    url: '/issue/item/list',
    method: 'get',
    params: query
  })
}

export function getIssueItem(issueId) {
  return request({
    url: '/issue/item/' + issueId,
    method: 'get'
  })
}

export function listIssueItemLogs(issueId) {
  return request({
    url: '/issue/item/' + issueId + '/logs',
    method: 'get'
  })
}

export function addIssueItem(data) {
  return request({
    url: '/issue/item',
    method: 'post',
    data: data
  })
}

export function updateIssueItem(data) {
  return request({
    url: '/issue/item',
    method: 'put',
    data: data
  })
}

export function delIssueItem(issueId) {
  return request({
    url: '/issue/item/' + issueId,
    method: 'delete'
  })
}
