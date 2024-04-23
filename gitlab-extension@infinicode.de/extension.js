/* jshint esnext:true */
/*
 *
 * GNOME Shell Extension for the beautiful GitLab Portal
 *
 * Copyright (C) 2020 * Florijan Hamzic <florijanh@gmail.com> *
 *
 * This file is part of gnome-shell-extension-gitlab.
 *
 * gnome-shell-extension-gitlab is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * gnome-shell-extension-gitlab is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-gitlab.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import GObject from 'gi://GObject'
import St from 'gi://St'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'
import { ScreenWrapper } from './components/screenWrapper/screenWrapper.js'

import * as ComponentsHelper from './helpers/components.js'
import { EventHandler } from './helpers/eventHandler.js'
import { initSettings, SettingsHandler } from './helpers/settings.js'
import { initTranslations } from './helpers/translations.js'

const MenuPosition = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2
}

export const GitLabPanelMenuButton = GObject.registerClass(
    class GitLabMenuButton extends PanelMenu.Button {
      _init () {
        super._init(0.5)

        this._previousPanelPosition = null
        this._settingsChangedId = null

        this._mainEventHandler = new EventHandler()
        this._settings = new SettingsHandler()

        const panelMenuIcon = new St.Icon({
          gicon: ComponentsHelper.getCustomIconPath('gitlab-symbolic'),
          style_class: 'system-status-icon'
        })

        const gitlabPanelIconBin = new St.Bin({
          style_class: 'gitlab-panel-bin',
          child: panelMenuIcon
        })

        this.add_child(gitlabPanelIconBin)
        this.add_style_class_name('gitlab-extension')

        let bin = new St.Widget({ style_class: 'gitlab-extension' })
        // For some minimal compatibility with PopupMenuItem
        bin._delegate = this
        this.menu.box.add_child(bin)

        this._screenWrapper = new ScreenWrapper(this._mainEventHandler)
        bin.add_child(this._screenWrapper)

        this._settingsChangedId = this._settings.connect('changed', () => this._sync())
        this.menu.connect('destroy', this._destroyExtension.bind(this))
        this._mainEventHandler.connect('hide-panel', () => this.menu.close())

        this._sync()
      }

      _sync (changedValue, changedKey) {
        this.checkPositionInPanel()
      }

      checkPositionInPanel () {
        const container = this.container
        const parent = container.get_parent()

        if (!parent || this._previousPanelPosition === this._settings.position_in_panel) {
          return
        }

        parent.remove_child(container)

        let children = null

        switch (this._settings.position_in_panel) {
          case MenuPosition.LEFT:
            children = Main.panel._leftBox.get_children()
            Main.panel._leftBox.insert_child_at_index(container, children.length)
            break
          case MenuPosition.CENTER:
            children = Main.panel._centerBox.get_children()
            Main.panel._centerBox.insert_child_at_index(container, children.length)
            break
          case MenuPosition.RIGHT:
            children = Main.panel._rightBox.get_children()
            Main.panel._rightBox.insert_child_at_index(container, 0)
            break
        }

        this._previousPanelPosition = this._settings.position_in_panel
      }

      _destroyExtension () {
        if (this._settingsChangedId) {
          this._settings.disconnect(this._settingsChangedId)
        }
      }
    }
)

let _extensionPanelMenuButton

export default class GitlabExtension extends Extension {
  enable () {
    initSettings(this)
    initTranslations(_)
    _extensionPanelMenuButton = new GitLabPanelMenuButton()
    Main.panel.addToStatusArea('gitlabMenu', _extensionPanelMenuButton)
    _extensionPanelMenuButton.checkPositionInPanel()
  }

  disable () {
    if (_extensionPanelMenuButton) {
      _extensionPanelMenuButton.destroy()
      _extensionPanelMenuButton = null
    }
  }
}
