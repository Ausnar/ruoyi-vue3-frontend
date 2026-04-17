import request from '@/utils/request'

export function listExternalCompany(query) {
  return request({
    url: '/manage/externalCompany/list',
    method: 'get',
    params: query
  })
}

export function getExternalCompany(companyRecordId) {
  return request({
    url: '/manage/externalCompany/' + companyRecordId,
    method: 'get'
  })
}

export function addExternalCompany(data) {
  return request({
    url: '/manage/externalCompany',
    method: 'post',
    data
  })
}

export function updateExternalCompany(data) {
  return request({
    url: '/manage/externalCompany',
    method: 'put',
    data
  })
}

export function toggleExternalCompany(companyRecordId) {
  return request({
    url: '/manage/externalCompany/' + companyRecordId + '/toggle',
    method: 'post'
  })
}

export function listExternalCompanyDuplicates(companyRecordId) {
  return request({
    url: '/manage/externalCompany/' + companyRecordId + '/duplicates',
    method: 'get'
  })
}

export function mergeExternalCompany(data) {
  return request({
    url: '/manage/externalCompany/merge',
    method: 'post',
    data
  })
}

export function exportExternalCompany(query) {
  return request({
    url: '/manage/externalCompany/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}
