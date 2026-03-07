import request from '@/utils/request'

// 查询灭火器维护记录列表
export function listInspection_Records(query) {
  return request({
    url: '/record/Inspection_Records/list',
    method: 'get',
    params: query
  })
}

// 查询灭火器维护记录详细
export function getInspection_Records(recordId) {
  return request({
    url: '/record/Inspection_Records/' + recordId,
    method: 'get'
  })
}

// 新增灭火器维护记录
export function addInspection_Records(data) {
  return request({
    url: '/record/Inspection_Records',
    method: 'post',
    data: data
  })
}

// 修改灭火器维护记录
export function updateInspection_Records(data) {
  return request({
    url: '/record/Inspection_Records',
    method: 'put',
    data: data
  })
}

// 删除灭火器维护记录
export function delInspection_Records(recordId) {
  return request({
    url: '/record/Inspection_Records/' + recordId,
    method: 'delete'
  })
}
