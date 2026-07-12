import request from '@/utils/request'

export function deviceDeptTreeSelect(query) {
  return request({
    url: '/manage/device/dept/tree',
    method: 'get',
    params: query
  })
}
