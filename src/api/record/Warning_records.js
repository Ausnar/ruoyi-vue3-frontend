import request from '@/utils/request'

// 查询报警记录列表
export function listWarning_records(query) {
  return request({
    url: '/record/Warning_records/list',
    method: 'get',
    params: query
  })
}

// 查询报警记录详细
export function getWarning_records(alarmId) {
  return request({
    url: '/record/Warning_records/' + alarmId,
    method: 'get'
  })
}

// 新增报警记录
export function addWarning_records(data) {
  return request({
    url: '/record/Warning_records',
    method: 'post',
    data: data
  })
}

// 修改报警记录
export function updateWarning_records(data) {
  return request({
    url: '/record/Warning_records',
    method: 'put',
    data: data
  })
}

// 删除报警记录
export function delWarning_records(alarmId) {
  return request({
    url: '/record/Warning_records/' + alarmId,
    method: 'delete'
  })
}
