import GLib from 'gi://GLib'

import { decodeBase64JsonOrDefault, isNullOrEmpty, isNullOrUndefined } from './data.js'

let _settings = null
let _extensionObject = {}

export const initSettings = extensionObject => {
  _extensionObject = extensionObject
}

export const POSITION_IN_PANEL_KEY = 'position-in-panel'
export const GITLAB_TOKEN = 'gitlab-token'
export const GITLAB_ACCOUNTS = 'gitlab-accounts'
export const SELECTED_GITLAB_ACCOUNT_INDEX = 'selected-gitlab-account-index'

export const SETTINGS_SCHEMA_DOMAIN = 'org.gnome.shell.extensions.gitlab'

export const DEFAULT_GITLAB_DATA = {
  name: 'gitlab.com',
  apiEndpoint: 'https://gitlab.com/api/v4',
  onlyOwnedProjects: false
}

export const SettingsHandler = class SettingsHandler {
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

  get extensionObject () {
    return _extensionObject
  }

  get _settings () {
    if (!_settings) {
      _settings = this.extensionObject.getSettings()
    }

    return _settings
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
