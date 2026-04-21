import request from '@/utils/request'

export function listIssueProjectModule(query) {
  return request({
    url: '/issue/project-module/list',
    method: 'get',
    params: query
  })
}

export function getIssueProjectModule(moduleId) {
  return request({
    url: '/issue/project-module/' + moduleId,
    method: 'get'
  })
}

export function listActiveIssueProjectModules(projectId) {
  return request({
    url: '/issue/project-module/options/active',
    method: 'get',
    params: { projectId }
  })
}

export function addIssueProjectModule(data) {
  return request({
    url: '/issue/project-module',
    method: 'post',
    data: data
  })
}

export function updateIssueProjectModule(data) {
  return request({
    url: '/issue/project-module',
    method: 'put',
    data: data
  })
}

export function toggleIssueProjectModule(moduleId) {
  return request({
    url: '/issue/project-module/' + moduleId + '/toggle',
    method: 'post'
  })
}
