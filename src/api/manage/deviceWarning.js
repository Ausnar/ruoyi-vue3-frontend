import request from '@/utils/request'

// 查询设备预警列表
export function listDeviceWarning(query) {
  return request({
    url: '/manage/device-warning/list',
    method: 'get',
    params: query
  })
}

// 查询首页设备预警概览
export function getDeviceWarningDashboard() {
  return request({
    url: '/manage/device-warning/dashboard',
    method: 'get'
  })
}

// 查询设备预警详细
export function getDeviceWarning(warningId) {
  return request({
    url: '/manage/device-warning/' + warningId,
    method: 'get'
  })
}
