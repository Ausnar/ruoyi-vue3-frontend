import request from '@/utils/request'

// 查询灭火器信息列表
export function listExtinguisher(query) {
  return request({
    url: '/manage/extinguisher/list',
    method: 'get',
    params: query
  })
}

// 查询灭火器信息详细
export function getExtinguisher(extinguisherId) {
  return request({
    url: '/manage/extinguisher/' + extinguisherId,
    method: 'get'
  })
}

// 新增灭火器信息
export function addExtinguisher(data) {
  return request({
    url: '/manage/extinguisher',
    method: 'post',
    data: data
  })
}

// 修改灭火器信息
export function updateExtinguisher(data) {
  return request({
    url: '/manage/extinguisher',
    method: 'put',
    data: data
  })
}

// 按标志明码刷新灭火器预警资料
export function refreshExtinguisherProfile(extinguisherId) {
  return request({
    url: '/manage/extinguisher/' + extinguisherId + '/profile/refresh',
    method: 'put'
  })
}

// 删除灭火器信息
export function delExtinguisher(extinguisherId) {
  return request({
    url: '/manage/extinguisher/' + extinguisherId,
    method: 'delete'
  })
}
