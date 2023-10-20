import Gdk from 'gi://Gdk'
import Gtk from 'gi://Gtk'

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import { initTranslations } from './helpers/translations.js'
import { setSettingsGetter } from './helpers/settings.js'

setSettingsGetter(() => ExtensionPreferences.lookupByURL(import.meta.url).getSettings())

import { AboutPage } from './components/settings/aboutPage.js'
import { GitlabAccountListPage } from './components/settings/gitlabAccountListPage.js'
import { SettingsPage } from './components/settings/settingsPage.js'


export default class GitlabExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow (window) {
    initTranslations(_)

    let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default())
    if (!iconTheme.get_search_path().includes(this.path + '/media')) {
      iconTheme.add_search_path(this.path + '/media')
    }

    window.set_search_enabled(true)

    const gitlabAccountListPage = new GitlabAccountListPage()
    window.add(gitlabAccountListPage)

    const settingsPage = new SettingsPage()
    window.add(settingsPage)

    const aboutPage = new AboutPage(this.path, this.metadata)
    window.add(aboutPage)
  }
}

