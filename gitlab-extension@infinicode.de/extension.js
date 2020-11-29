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

        this._currentPanelPosition = null

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

        Settings.connect('changed', () => this._sync())

        this._sync()

        EventHandler.connect('hide-panel', () => this.menu.close())
      }

      _sync () {
        this.checkPositionInPanel()
      }

      checkPositionInPanel () {
        const newPosition = Settings.position_in_panel

        if (this._currentPanelPosition === newPosition) {
          return
        }

        this.get_parent().remove_actor(this.actor)

        switch (this._currentPanelPosition) {
          case MenuPosition.LEFT:
            Main.panel._leftBox.remove_actor(this.actor)
            break
          case MenuPosition.CENTER:
            Main.panel._centerBox.remove_actor(this.actor)
            break
          case MenuPosition.RIGHT:
            Main.panel._rightBox.remove_actor(this.actor)
            break
        }

        let children = null
        switch (newPosition) {
          case MenuPosition.LEFT:
            children = Main.panel._leftBox.get_children()
            Main.panel._leftBox.insert_child_at_index(this.actor, children.length)
            break
          case MenuPosition.CENTER:
            children = Main.panel._centerBox.get_children()
            Main.panel._centerBox.insert_child_at_index(this.actor, children.length)
            break
          case MenuPosition.RIGHT:
            children = Main.panel._rightBox.get_children()
            Main.panel._rightBox.insert_child_at_index(this.actor, 0)
            break
        }

        this._currentPanelPosition = newPosition
      }

      stop () {
        // TODO:
        // clear cache (add cache before ^^)
        // ensure if destroy signal is bubbled correctly
        //   - unregister signal connections
        //   - dispose components
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
}

function disable () {
  gitlabPanelMenuButton.stop()
  gitlabPanelMenuButton.destroy()
}
