import request from '@/utils/request'

export function previewUnitDeviceReport(query) {
  return request({
    url: '/report/unit-device/preview',
    method: 'get',
    params: query
  })
}
