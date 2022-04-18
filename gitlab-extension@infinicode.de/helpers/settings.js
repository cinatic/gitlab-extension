const { GLib, Gio } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { decodeBase64JsonOrDefault, isNullOrEmpty, isNullOrUndefined } = Me.imports.helpers.data

var POSITION_IN_PANEL_KEY = 'position-in-panel'
var GITLAB_TOKEN = 'gitlab-token'
var GITLAB_ACCOUNTS = 'gitlab-accounts'
var SELECTED_GITLAB_ACCOUNT_INDEX = 'selected-gitlab-account-index'

var SETTINGS_SCHEMA_DOMAIN = 'org.gnome.shell.extensions.gitlab'

var DEFAULT_GITLAB_DATA = {
  name: 'gitlab.com',
  apiEndpoint: 'https://gitlab.com/api/v4',
  onlyOwnedProjects: false
}

var SettingsHandler = class SettingsHandler {
  constructor () {
    this._settings = ExtensionUtils.getSettings()
  }

  get position_in_panel () {
    return this._settings.get_enum(POSITION_IN_PANEL_KEY)
  }

  set position_in_panel (value) {
    return this._settings.set_enum(POSITION_IN_PANEL_KEY, value)
  }

  get selected_gitlab_account () {
    const selectedIndex = this.selected_gitlab_account_index
    const accounts = this.gitlab_accounts

    if (!isNullOrEmpty(accounts)) {
      return accounts[selectedIndex] || accounts[0]
    }
  }

  get selected_gitlab_account_index () {
    return this._settings.get_int(SELECTED_GITLAB_ACCOUNT_INDEX) || 0
  }

  set selected_gitlab_account_index (v) {
    return this._settings.set_int(SELECTED_GITLAB_ACCOUNT_INDEX, v)
  }

  get gitlab_accounts () {
    const accounts = this._loadAndValidateAccounts()

    return accounts
  }

  set gitlab_accounts (v) {
    this._settings.set_string(GITLAB_ACCOUNTS, GLib.base64_encode(JSON.stringify(v)))
  }

  connect (identifier, onChange) {
    return this._settings.connect(identifier, onChange)
  }

  disconnect (connectId) {
    this._settings.disconnect(connectId)
  }

  _loadAndValidateAccounts () {
    let accounts = this._migrateAccountsFromSingleAccountStructure()

    if (isNullOrEmpty(accounts)) {
      const rawString = this._settings.get_string(GITLAB_ACCOUNTS)
      accounts = decodeBase64JsonOrDefault(rawString, [])
    }

    return this._ensureHealthyGitlabAccountStructure(accounts)
  }

  _migrateAccountsFromSingleAccountStructure () {
    /****
     * For backwards compatiblity intercept here and check if old token exist
     * if we found old format convert to new format and save
     */
    try {
      const oldToken = this._settings.get_string(GITLAB_TOKEN)

      if (oldToken) {
        const newData = [
          {
            ...DEFAULT_GITLAB_DATA,
            token: oldToken
          }]

        this._settings.set_string(GITLAB_TOKEN, '')
        this._settings.set_string(GITLAB_ACCOUNTS, GLib.base64_encode(JSON.stringify(newData)))

        return newData
      }
    } catch (e) {
      log(`failed to convert old token ${e}`)
    }
  }

  _ensureHealthyGitlabAccountStructure (accounts) {
    let normalizedAccounts = []

    try {
      normalizedAccounts = accounts.map(item => ({
        name: item.name || DEFAULT_GITLAB_DATA.name,
        apiEndpoint: item.apiEndpoint || DEFAULT_GITLAB_DATA.apiEndpoint,
        token: item.token || '',
        onlyOwnedProjects: isNullOrUndefined(item.onlyOwnedProjects) ? DEFAULT_GITLAB_DATA.onlyOwnedProjects : item.onlyOwnedProjects
      }))
    } catch (e) {
      log(`failed to normalize accounts data ${e}`)
    }

    return normalizedAccounts
  }
}
