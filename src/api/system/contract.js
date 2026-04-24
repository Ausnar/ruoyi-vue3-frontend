import request from '@/utils/request'

// 查询合同管理列表
export function listContract(query) {
  return request({
    url: '/system/contract/list',
    method: 'get',
    params: query
  })
}

// 查询合同管理详情
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
    data
  })
}

// 修改合同管理
export function updateContract(data) {
  return request({
    url: '/system/contract',
    method: 'put',
    data
  })
}

// 删除合同管理
export function delContract(configId) {
  return request({
    url: '/system/contract/' + configId,
    method: 'delete'
  })
}

// 合同性质总览
export function getContractOverview() {
  return request({
    url: '/system/contract/statistics/overview',
    method: 'get'
  })
}

// 合同状态分布统计
export function getStatusStatistics(contractType) {
  return request({
    url: '/system/contract/statistics/status',
    method: 'get',
    params: { contractType }
  })
}

// 合同到期状态分布统计
export function getExpireStatusStatistics(contractType) {
  return request({
    url: '/system/contract/statistics/expireStatus',
    method: 'get',
    params: { contractType }
  })
}

// 合同数量 TOP 部门统计
export function getTopDeptStatistics(limit = 10, contractType) {
  return request({
    url: '/system/contract/statistics/topDept',
    method: 'get',
    params: { limit, contractType }
  })
}

// 合同到期趋势统计
export function getExpiryTrendStatistics(months = 6, contractType) {
  return request({
    url: '/system/contract/statistics/expiryTrend',
    method: 'get',
    params: { months, contractType }
  })
}
