import request from '@/utils/request'

export function getDashboardMapHierarchy() {
  return request({
    url: '/manage/dashboard/map/hierarchy',
    method: 'get'
  })
}
