import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk'

import { SettingsHandler } from '../../helpers/settings.js'
import { Translations } from '../../helpers/translations.js'

export const SettingsPage = GObject.registerClass({
      GTypeName: 'GitlabExtension-SettingsPage',
    },
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
    GObject.registerClass({ GTypeName: 'GitlabExtension-GeneralPreferenceGroup' }, this)
  }

  constructor () {
    super({
      title: Translations.SETTINGS.TITLE_GENERAL
    })

    this._settings = new SettingsHandler()

    const panelPositions = new Gtk.StringList()
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_LEFT)
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_CENTER)
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_RIGHT)

    const panelPositionRow = new Adw.ComboRow({
      title: Translations.SETTINGS.POSITION_IN_PANEL,
      model: panelPositions,
      selected: this._settings.position_in_panel
    })

    panelPositionRow.connect('notify::selected', (widget) => {
      this._settings.position_in_panel = widget.selected
    })
    this.add(panelPositionRow)
  }
}
