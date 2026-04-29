import request from '@/utils/request'

export function previewDeviceReport(query) {
  return request({
    url: '/manage/device-report/preview',
    method: 'get',
    params: query
  })
}
