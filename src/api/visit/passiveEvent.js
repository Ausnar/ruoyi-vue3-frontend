import request from '@/utils/request'

export function listPassiveEvent(query) {
  return request({
    url: '/visit/passive-event/list',
    method: 'get',
    params: query
  })
}

export function getPassiveEvent(eventId) {
  return request({
    url: '/visit/passive-event/' + eventId,
    method: 'get'
  })
}

export function confirmPassiveEvent(eventId, data) {
  return request({
    url: '/visit/passive-event/' + eventId + '/confirm',
    method: 'post',
    data
  })
}

export function ignorePassiveEvent(eventId) {
  return request({
    url: '/visit/passive-event/' + eventId + '/ignore',
    method: 'post'
  })
}
