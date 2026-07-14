import request from '@/utils/request'

export function previewDeviceOperationReport(query) {
  return request({
    url: '/report/device-operation/preview',
    method: 'get',
    params: query,
    timeout: 180000
  })
}
