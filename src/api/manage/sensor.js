import request from '@/utils/request'

// 查询传感器信息列表
export function listSensor(query) {
  return request({
    url: '/manage/sensor/list',
    method: 'get',
    params: query
  })
}

// 查询传感器信息详细
export function getSensor(sensorId) {
  return request({
    url: '/manage/sensor/' + sensorId,
    method: 'get'
  })
}

// 新增传感器信息
export function addSensor(data) {
  return request({
    url: '/manage/sensor',
    method: 'post',
    data: data
  })
}

// 修改传感器信息
export function updateSensor(data) {
  return request({
    url: '/manage/sensor',
    method: 'put',
    data: data
  })
}

// 删除传感器信息
export function delSensor(sensorId) {
  return request({
    url: '/manage/sensor/' + sensorId,
    method: 'delete'
  })
}

// 查询传感器历史数据列表
export function listSensorHistory(query) {
  return request({
    url: '/manage/sensor/history/list',
    method: 'get',
    params: query
  })
}

// 获取传感器历史数据（用于图表）
export function getSensorHistoryData(sensorId, startTime, endTime) {
  return request({
    url: '/manage/sensor/history/chart',
    method: 'get',
    params: { sensorId, startTime, endTime }
  })
}
