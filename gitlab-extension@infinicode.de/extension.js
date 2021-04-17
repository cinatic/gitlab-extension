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

const { GObject, St } = imports.gi

const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { EventHandler } = Me.imports.helpers.eventHandler
const { initTranslations } = Me.imports.helpers.translations
const { ScreenWrapper } = Me.imports.components.screenWrapper.screenWrapper
const { Settings } = Me.imports.helpers.settings

const ComponentsHelper = Me.imports.helpers.components

const MenuPosition = {
  CENTER: 0,
  RIGHT: 1,
  LEFT: 2
}

var GitLabPanelMenuButton = GObject.registerClass(
    class GitLabMenuButton extends PanelMenu.Button {
      _init () {
        super._init(0.5)

        this._settingsChangedId = null

        const panelMenuIcon = new St.Icon({
          gicon: ComponentsHelper.getCustomIconPath('gitlab-symbolic'),
          style_class: 'system-status-icon'
        })

        const gitlabPanelIconBin = new St.Bin({
          style_class: 'gitlab-panel-bin',
          child: panelMenuIcon
        })

        this.add_actor(gitlabPanelIconBin)
        this.add_style_class_name('gitlab-extension')

        let bin = new St.Widget({ style_class: 'gitlab-extension' })
        // For some minimal compatibility with PopupMenuItem
        bin._delegate = this
        this.menu.box.add_child(bin)

        this._screenWrapper = new ScreenWrapper()
        bin.add_actor(this._screenWrapper)

        this._settingsChangedId = Settings.connect('changed', () => this._sync())
        this.menu.connect('destroy', this._destroyExtension.bind(this))
        EventHandler.connect('hide-panel', () => this.menu.close())

        this._sync()
      }

      _sync (changedValue, changedKey) {
        this.checkPositionInPanel()
      }

      checkPositionInPanel () {
        const container = this.container
        const parent = container.get_parent()

        if (parent) {
          parent.remove_actor(container)
        }

        let children = null

        switch (Settings.position_in_panel) {
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
      }

      _destroyExtension () {
        if (this._settingsChangedId) {
          Settings.disconnect(this._settingsChangedId)
        }
      }
    }
)

var gitlabPanelMenuButton

function init (extensionMeta) {
  initTranslations()
}

function enable () {
  gitlabPanelMenuButton = new GitLabPanelMenuButton()
  Main.panel.addToStatusArea('gitlabMenu', gitlabPanelMenuButton)
  gitlabPanelMenuButton.checkPositionInPanel()
}

function disable () {
  gitlabPanelMenuButton.destroy()
}
