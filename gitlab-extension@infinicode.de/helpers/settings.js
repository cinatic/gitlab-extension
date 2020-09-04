const { Gio } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils

const POSITION_IN_PANEL_KEY = 'position-in-panel'
const GITLAB_TOKEN = 'gitlab-token'

var SETTINGS_SCHEMA_DOMAIN = 'org.gnome.shell.extensions.gitlab'

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

  get gitlab_token () {
    return this._settings.get_string(GITLAB_TOKEN)
  }

  connect (identifier, onChange) {
    this._settings.connect(identifier, onChange)
  }
}

var Settings = new Handler()
