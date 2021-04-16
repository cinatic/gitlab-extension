const Gettext = imports.gettext
const _ = Gettext.gettext

const Config = imports.misc.config
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { SETTINGS_SCHEMA_DOMAIN } = Me.imports.helpers.settings

var Translations = {
  BACK: _('back'),
  COMMITS: _('Commits'),
  FILTER_PLACEHOLDER: _('Filter Results'),
  LAST_UPDATED: _('Updated %s ago'),
  LOADING_DATA: _('Loading Data'),
  LOADING_DATA_ERROR: _('Error loading data'),
  LOADING_DATA_ERROR_SPECIFIC: _('Error Loading %s: %s'),
  PIPELINES: _('Pipelines'),
  TOKEN_ERROR: _('No accounts configured. Please open settings and add at least one gitlab account.'),

  SETTINGS: {
    ACCOUNT_NAME: _('Name'),
    TOKEN: _('Token'),
    API_ENDPOINT: _('API Endpoint'),
    ONLY_OWNED_PROJECTS: _('Only Owned Projects')
  }
}

/**
 * initTranslations:
 * @domain: (optional): the gettext domain to use
 *
 * Initialize Gettext to load translations from extensionsdir/locale.
 * If @domain is not provided, it will be taken from metadata['gettext-domain']
 */
var initTranslations = domain => {
  if (Config.PACKAGE_VERSION.startsWith('3.32')) {
    ExtensionUtils.initTranslations(domain)
  } else {
    const extension = ExtensionUtils.getCurrentExtension()

    domain = domain || SETTINGS_SCHEMA_DOMAIN || extension.metadata['gettext-domain']

    // check if this extension was built with "make zip-file", and thus
    // has the locale files in a subfolder
    // otherwise assume that extension has been installed in the
    // same prefix as gnome-shell
    const localeDir = extension.dir.get_child('locale')
    if (localeDir.query_exists(null)) {
      Gettext.bindtextdomain(domain, localeDir.get_path())
    } else {
      Gettext.bindtextdomain(domain, Config.LOCALEDIR)
    }
  }
}
