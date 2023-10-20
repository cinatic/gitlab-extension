import { cacheOrDefault } from '../helpers/data.js'
import { fetch } from '../helpers/fetch.js'
import { SettingsHandler } from '../helpers/settings.js'

const headers = token => ({
  'PRIVATE-TOKEN': token
})

export const getOwnedProjects = async ({ per_page }) => {
  const settings = new SettingsHandler()

  const { name: accountName, apiEndpoint, token, onlyOwnedProjects } = settings.selected_gitlab_account || {}

  return cacheOrDefault(`projects_${apiEndpoint}_${accountName}`, () => {
    const queryParameters = {
      owned: onlyOwnedProjects,
      order_by: 'last_activity_at',
      per_page
    }

    const url = `${apiEndpoint}/projects`

    return fetch({ url, headers: headers(token), queryParameters })
  })
}

export const getCommits = async ({ projectId, per_page }) => {
  const settings = new SettingsHandler()

  const { apiEndpoint, token } = settings.selected_gitlab_account || {}

  const queryParameters = {
    per_page
  }

  const url = `${apiEndpoint}/projects/${projectId}/repository/commits`

  return fetch({ url, headers: headers(token), queryParameters })
}

export const getPipelines = async ({ projectId, per_page }) => {
  const settings = new SettingsHandler()

  const { apiEndpoint, token } = settings.selected_gitlab_account || {}

  const queryParameters = {
    per_page
  }

  let url = `${apiEndpoint}/projects/${projectId}/pipelines`

  return fetch({ url, headers: headers(token), queryParameters })
}
