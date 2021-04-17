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

/**
 * getSettings:
 * @schemaName: (optional): the GSettings schema id
 *
 * Builds and return a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is not provided, it is taken from
 * metadata['settings-schema'].
 */
var getSettings = () => {
  const extension = ExtensionUtils.getCurrentExtension()

  const schemaName = SETTINGS_SCHEMA_DOMAIN || extension.metadata['settings-schema']

  const GioSSS = Gio.SettingsSchemaSource

  // check if this extension was built with "make zip-file", and thus
  // has the schema files in a subfolder
  // otherwise assume that extension has been installed in the
  // same prefix as gnome-shell (and therefore schemas are available
  // in the standard folders)
  const schemaDir = extension.dir.get_child('schemas')

  let schemaSource

  if (schemaDir.query_exists(null)) {
    schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
        GioSSS.get_default(),
        false)
  } else {
    schemaSource = GioSSS.get_default()
  }

  const schemaObj = schemaSource.lookup(schemaName, true)

  if (!schemaObj) {
    throw new Error('Schema ' + schemaName + ' could not be found for extension ' + extension.metadata.uuid + '. Please check your installation.')
  }

  return new Gio.Settings({
    settings_schema: schemaObj
  })
}

const Handler = class {
  constructor () {
    this._settings = getSettings(SETTINGS_SCHEMA_DOMAIN)
  }

  get position_in_panel () {
    return this._settings.get_enum(POSITION_IN_PANEL_KEY)
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

var Settings = new Handler()
