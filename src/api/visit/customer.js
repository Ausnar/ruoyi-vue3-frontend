import request from '@/utils/request'

export function listVisitCustomer(query) {
  return request({
    url: '/visit/customer/list',
    method: 'get',
    params: query
  })
}

export function getVisitCustomer(customerId) {
  return request({
    url: '/visit/customer/' + customerId,
    method: 'get'
  })
}

export function addVisitCustomer(data) {
  return request({
    url: '/visit/customer',
    method: 'post',
    data
  })
}

export function updateVisitCustomer(data) {
  return request({
    url: '/visit/customer',
    method: 'put',
    data
  })
}

export function delVisitCustomer(customerId) {
  return request({
    url: '/visit/customer/' + customerId,
    method: 'delete'
  })
}
