const Gettext = imports.gettext
const _ = Gettext.gettext

const Config = imports.misc.config
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { SETTINGS_SCHEMA_DOMAIN } = Me.imports.helpers.settings

var Translations = {
  EXTENSION: {
    NAME: _('Gitlab Extension'),
    DESCRIPTION: _('GitLab will provide you a couple of information about your projects and pipelines in the Panel.')
  },

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
    DEFAULT_NAME: _('Config %d'),
    ACCOUNT_NAME: _('Name'),
    TOKEN: _('Token'),
    API_ENDPOINT: _('API Endpoint'),
    ONLY_OWNED_PROJECTS: _('Only Owned Projects'),
    ALL_PROJECTS: _('All Projects'),
    ADD_CONFIG: _('Add Gitlab Config'),

    TITLE_GENERAL: _('General'),
    TITLE_SETTINGS: _('Settings'),
    TITLE_ABOUT: _('About'),
    TITLE_ACCOUNTS: _('Accounts'),
    TITLE_ACCOUNT_LIST: _('Account List'),

    POSITION_IN_PANEL: _('Position in Panel'),
    POSITION_IN_PANEL_LEFT: _('Left'),
    POSITION_IN_PANEL_CENTER: _('Center'),
    POSITION_IN_PANEL_RIGHT: _('Right'),
  },

  MISC: {
    OS: _('OS'),
    EXTENSION_VERSION: _('Extension Version'),
    GIT_COMMIT: _('Git Commit'),
    GNOME_VERSION: _('GNOME Version'),
    SESSION_TYPE: _('Session Type'),
  },
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
