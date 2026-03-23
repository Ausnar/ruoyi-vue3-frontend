import request from '@/utils/request'

// 查询合同管理列表
export function listContract(query) {
  return request({
    url: '/system/contract/list',
    method: 'get',
    params: query
  })
}

// 查询合同管理详细
export function getContract(configId) {
  return request({
    url: '/system/contract/' + configId,
    method: 'get'
  })
}

// 新增合同管理
export function addContract(data) {
  return request({
    url: '/system/contract',
    method: 'post',
    data: data
  })
}

// 修改合同管理
export function updateContract(data) {
  return request({
    url: '/system/contract',
    method: 'put',
    data: data
  })
}

// 删除合同管理
export function delContract(configId) {
  return request({
    url: '/system/contract/' + configId,
    method: 'delete'
  })
}

// 合同状态分布统计
export function getStatusStatistics() {
  return request({
    url: '/system/contract/statistics/status',
    method: 'get'
  })
}

// 合同过期状态分布统计
export function getExpireStatusStatistics() {
  return request({
    url: '/system/contract/statistics/expireStatus',
    method: 'get'
  })
}

// 合同数量TOP部门统计
export function getTopDeptStatistics(limit = 10) {
  return request({
    url: '/system/contract/statistics/topDept',
    method: 'get',
    params: { limit }
  })
}

// 合同到期趋势统计
export function getExpiryTrendStatistics(months = 6) {
  return request({
    url: '/system/contract/statistics/expiryTrend',
    method: 'get',
    params: { months }
  })
}
