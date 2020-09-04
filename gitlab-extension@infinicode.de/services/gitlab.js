const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { fetch } = Me.imports.helpers.fetch
const { Settings } = Me.imports.helpers.settings

const API_ENDPOINT = 'https://gitlab.com/api/v4'

const headers = () => ({
  'PRIVATE-TOKEN': Settings.gitlab_token
})

var getOwnedProjects = async ({ per_page }) => {
  const queryParameters = {
    owned: 1,
    order_by: 'last_activity_at',
    per_page
  }

  const url = `${API_ENDPOINT}/projects`

  return fetch({ url, headers: headers(), queryParameters })
}

var getCommits = async ({ projectId, per_page }) => {
  const queryParameters = {
    per_page
  }

  const url = `${API_ENDPOINT}/projects/${projectId}/repository/commits`

  return fetch({ url, headers: headers(), queryParameters })
}

var getPipelines = async ({ projectId, per_page }) => {
  const queryParameters = {
    per_page
  }

  let url = `${API_ENDPOINT}/projects/${projectId}/pipelines`

  return fetch({ url, headers: headers(), queryParameters })
}
