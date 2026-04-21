import request from '@/utils/request'

export function listIssueProject(query) {
  return request({
    url: '/issue/project/list',
    method: 'get',
    params: query
  })
}

export function getIssueProject(projectId) {
  return request({
    url: '/issue/project/' + projectId,
    method: 'get'
  })
}

export function listActiveIssueProjects() {
  return request({
    url: '/issue/project/options/active',
    method: 'get'
  })
}

export function addIssueProject(data) {
  return request({
    url: '/issue/project',
    method: 'post',
    data: data
  })
}

export function updateIssueProject(data) {
  return request({
    url: '/issue/project',
    method: 'put',
    data: data
  })
}

export function toggleIssueProject(projectId) {
  return request({
    url: '/issue/project/' + projectId + '/toggle',
    method: 'post'
  })
}
