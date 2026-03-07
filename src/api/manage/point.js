import request from '@/utils/request'

// 查询消防点信息列表
export function listPoint(query) {
  return request({
    url: '/manage/point/list',
    method: 'get',
    params: query
  })
}

// 查询消防点信息详细
export function getPoint(firePointId) {
  return request({
    url: '/manage/point/' + firePointId,
    method: 'get'
  })
}

// 新增消防点信息
export function addPoint(data) {
  return request({
    url: '/manage/point',
    method: 'post',
    data: data
  })
}

// 修改消防点信息
export function updatePoint(data) {
  return request({
    url: '/manage/point',
    method: 'put',
    data: data
  })
}

// 删除消防点信息
export function delPoint(firePointId) {
  return request({
    url: '/manage/point/' + firePointId,
    method: 'delete'
  })
}
