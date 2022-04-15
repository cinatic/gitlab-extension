const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gio, GObject, Gtk } = imports.gi

const { Settings } = Me.imports.helpers.settings
const { Translations } = Me.imports.helpers.translations

var SettingsPage = GObject.registerClass(
    class GitlabSettingsPreferencePage extends Adw.PreferencesPage {
      _init () {
        super._init({
          title: Translations.SETTINGS.TITLE_SETTINGS,
          icon_name: 'view-list-symbolic',
          name: 'SettingsPage'
        })

        const preferenceGroup = new GeneralPreferenceGroup()
        this.add(preferenceGroup)
      }
    })

class GeneralPreferenceGroup extends Adw.PreferencesGroup {
  static {
    GObject.registerClass(this)
  }

  constructor () {
    super({
      title: Translations.SETTINGS.TITLE_GENERAL
    })

    const panelPositions = new Gtk.StringList()
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_LEFT)
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_CENTER)
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_RIGHT)

    const panelPositionRow = new Adw.ComboRow({
      title: Translations.SETTINGS.POSITION_IN_PANEL,
      model: panelPositions,
      selected: Settings.position_in_panel
    })

    panelPositionRow.connect('notify::selected', (widget) => {
      Settings.position_in_panel = widget.selected
    })
    this.add(panelPositionRow)
  }
}
