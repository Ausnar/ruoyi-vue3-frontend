import request from '@/utils/request'

export function listDeviceWarningTask(query) {
  return request({
    url: '/manage/device-warning-task/list',
    method: 'get',
    params: query
  })
}

export function getDeviceWarningTask(taskId) {
  return request({
    url: `/manage/device-warning-task/${taskId}`,
    method: 'get'
  })
}

export function dispatchDeviceWarning(warningId) {
  return request({
    url: `/manage/device-warning-task/dispatch/${warningId}`,
    method: 'post'
  })
}

export function listTaskCandidates(taskId) {
  return request({
    url: `/manage/device-warning-task/${taskId}/candidates`,
    method: 'get'
  })
}

export function reassignDeviceWarningTask(taskId, data) {
  return request({
    url: `/manage/device-warning-task/${taskId}/assignee`,
    method: 'put',
    data
  })
}

export function startDeviceWarningTask(taskId) {
  return request({
    url: `/manage/device-warning-task/${taskId}/start`,
    method: 'put'
  })
}

export function submitDeviceWarningTreatment(taskId, data, files = []) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })
  files.forEach(file => formData.append('files', file))
  return request({
    url: `/manage/device-warning-task/${taskId}/treatment-with-attachments`,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getDeviceWarningTreatmentAttachment(attachmentId) {
  return request({
    url: `/manage/device-warning-task/attachment/${attachmentId}`,
    method: 'get',
    responseType: 'blob'
  })
}
