const { GLib, Gio } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { decodeBase64JsonOrDefault, isNullOrEmpty } = Me.imports.helpers.data

const POSITION_IN_PANEL_KEY = 'position-in-panel'
const GITLAB_TOKEN = 'gitlab-token'
const GITLAB_ACCOUNTS = 'gitlab-accounts'
const SELECTED_GITLAB_ACCOUNT_INDEX = 'selected-gitlab-account-index'

var SETTINGS_SCHEMA_DOMAIN = 'org.gnome.shell.extensions.gitlab'

var DEFAULT_GITLAB_DATA = {
  name: 'gitlab.com',
  apiEndpoint: 'https://gitlab.com/api/v4'
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
    /****
     * For backwards compatiblity intercept here and check if old token exist
     * if we found old format convert to new format and save
     */
    try {
      const oldToken = this._settings.get_string(GITLAB_TOKEN)

      if (oldToken) {
        const newData = [{
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

    const rawString = this._settings.get_string(GITLAB_ACCOUNTS)
    return decodeBase64JsonOrDefault(rawString, [])
  }

  connect (identifier, onChange) {
    this._settings.connect(identifier, onChange)
  }
}

var Settings = new Handler()
