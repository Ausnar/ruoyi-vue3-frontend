import request from '@/utils/request'

export function listManualGateway(query) {
  return request({
    url: '/manage/manual-gateway/list',
    method: 'get',
    params: query
  })
}

export function getManualGateway(recordId) {
  return request({
    url: '/manage/manual-gateway/' + recordId,
    method: 'get'
  })
}

export function addManualGateway(data) {
  return request({
    url: '/manage/manual-gateway',
    method: 'post',
    data
  })
}

export function updateManualGateway(data) {
  return request({
    url: '/manage/manual-gateway',
    method: 'put',
    data
  })
}

export function voidManualGateway(recordId) {
  return request({
    url: '/manage/manual-gateway/' + recordId + '/void',
    method: 'post'
  })
}

export function exportManualGateway(query) {
  return request({
    url: '/manage/manual-gateway/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}

export function listManualExternalCompanies(query) {
  return request({
    url: '/manage/manual-gateway/externalCompanies',
    method: 'get',
    params: query
  })
}

export function addManualExternalCompany(data) {
  return request({
    url: '/manage/manual-gateway/externalCompanies',
    method: 'post',
    data
  })
}
