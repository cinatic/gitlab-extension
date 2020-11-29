const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { fetch } = Me.imports.helpers.fetch
const { Settings } = Me.imports.helpers.settings

const headers = token => ({
  'PRIVATE-TOKEN': token
})

var getOwnedProjects = async ({ per_page }) => {
  const { apiEndpoint, token } = Settings.selected_gitlab_account || {}

  log(`request: ${apiEndpoint} ${token}`)

  const queryParameters = {
    owned: 1,
    order_by: 'last_activity_at',
    per_page
  }

  const url = `${apiEndpoint}/projects`

  return fetch({ url, headers: headers(token), queryParameters })
}

var getCommits = async ({ projectId, per_page }) => {
  const { apiEndpoint, token } = Settings.selected_gitlab_account || {}

  const queryParameters = {
    per_page
  }

  const url = `${apiEndpoint}/projects/${projectId}/repository/commits`

  return fetch({ url, headers: headers(token), queryParameters })
}

var getPipelines = async ({ projectId, per_page }) => {
  const { apiEndpoint, token } = Settings.selected_gitlab_account || {}

  const queryParameters = {
    per_page
  }

  let url = `${apiEndpoint}/projects/${projectId}/pipelines`

  return fetch({ url, headers: headers(token), queryParameters })
}
