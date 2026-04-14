import request from '@/utils/request'

export function listMyVisitApply(query) {
  return request({
    url: '/visit/apply/my-list',
    method: 'get',
    params: query
  })
}

export function listApproveVisitApply(query) {
  return request({
    url: '/visit/apply/approve-list',
    method: 'get',
    params: query
  })
}

export function getVisitApply(visitId) {
  return request({
    url: '/visit/apply/' + visitId,
    method: 'get'
  })
}

export function getVisitApplyLogs(visitId) {
  return request({
    url: '/visit/apply/' + visitId + '/logs',
    method: 'get'
  })
}

export function submitVisitApply(data) {
  return request({
    url: '/visit/apply/submit',
    method: 'post',
    data
  })
}

export function resubmitVisitApply(data) {
  return request({
    url: '/visit/apply/resubmit',
    method: 'put',
    data
  })
}

export function withdrawVisitApply(visitId) {
  return request({
    url: '/visit/apply/' + visitId + '/withdraw',
    method: 'post'
  })
}

export function approveVisitApply(visitId, data) {
  return request({
    url: '/visit/apply/' + visitId + '/approve',
    method: 'post',
    data
  })
}

export function rejectVisitApply(visitId, data) {
  return request({
    url: '/visit/apply/' + visitId + '/reject',
    method: 'post',
    data
  })
}

export function feedbackVisitApply(data) {
  return request({
    url: '/visit/apply/feedback',
    method: 'post',
    data
  })
}

export function listContractOptions() {
  return request({
    url: '/visit/customer-source/contract-options',
    method: 'get'
  })
}
