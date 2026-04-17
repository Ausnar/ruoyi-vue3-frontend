import request from '@/utils/request'

export function listManualSensor(query) {
  return request({
    url: '/manage/manual-sensor/list',
    method: 'get',
    params: query
  })
}

export function getManualSensor(sensorRecordId) {
  return request({
    url: '/manage/manual-sensor/' + sensorRecordId,
    method: 'get'
  })
}

export function addManualSensor(data) {
  return request({
    url: '/manage/manual-sensor',
    method: 'post',
    data
  })
}

export function updateManualSensor(data) {
  return request({
    url: '/manage/manual-sensor',
    method: 'put',
    data
  })
}

export function voidManualSensor(sensorRecordId) {
  return request({
    url: '/manage/manual-sensor/' + sensorRecordId + '/void',
    method: 'post'
  })
}

export function exportManualSensor(query) {
  return request({
    url: '/manage/manual-sensor/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}
