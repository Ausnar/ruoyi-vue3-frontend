import request from '@/utils/request'

export function listCompanyDeptMapping(query) {
  return request({
    url: '/manage/companyDeptMapping/list',
    method: 'get',
    params: query
  })
}

export function getCompanyDeptMapping(mappingId) {
  return request({
    url: '/manage/companyDeptMapping/' + mappingId,
    method: 'get'
  })
}

export function addCompanyDeptMapping(data) {
  return request({
    url: '/manage/companyDeptMapping',
    method: 'post',
    data: data
  })
}

export function updateCompanyDeptMapping(data) {
  return request({
    url: '/manage/companyDeptMapping',
    method: 'put',
    data: data
  })
}

export function delCompanyDeptMapping(mappingId) {
  return request({
    url: '/manage/companyDeptMapping/' + mappingId,
    method: 'delete'
  })
}

export function listExternalCompanies(query) {
  return request({
    url: '/manage/companyDeptMapping/externalCompanies',
    method: 'get',
    params: query
  })
}
