import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Translations } from '../../helpers/translations.js'
import { IconButton } from '../buttons/iconButton.js'

export const SearchBar = GObject.registerClass({
  Signals: {
    'text-change': {
      param_types: [GObject.TYPE_STRING]
    },
    'refresh': {}
  }
}, class SearchBar extends St.BoxLayout {
  _init ({ back_screen_name, mainEventHandler } = {}) {
    super._init({
      style_class: 'search-bar',
      x_expand: true
    })

    this._mainEventHandler = mainEventHandler
    this.back_screen_name = back_screen_name

    this._searchAreaBox = this._createSearchArea()
    this._buttonBox = this._createButtonBox()

    this.add_child(this._searchAreaBox)
    this.add_child(this._buttonBox)

    this.connect('destroy', this._onDestroy.bind(this))
  }

  _createSearchArea () {
    let searchInputBox = new St.BoxLayout({
      style_class: 'search-area-box',
      x_expand: true
    })

    if (this.back_screen_name) {
      const backIconButton = new IconButton({
        style_class: 'navigate-back-icon-button',
        icon_name: 'go-previous-symbolic',
        text: Translations.BACK,
        onClick: () => this._mainEventHandler.emit('show-screen', { screen: this.back_screen_name })
      })

      searchInputBox.add_child(backIconButton)
    }

    const searchIcon = new St.Icon({
      style_class: 'search-entry-icon',
      icon_name: 'edit-find-symbolic'
    })

    const inputBox = new St.Entry({
      style_class: 'search-text-input',
      hint_text: Translations.FILTER_PLACEHOLDER,
      can_focus: true
    })

    inputBox.connect('notify::text', entry => this.emit('text-change', entry.text))

    inputBox.set_primary_icon(searchIcon)

    const inputBoxBin = new St.Bin({
      style_class: 'search-text-input-bin',
      x_expand: true,
      child: inputBox
    })

    searchInputBox.add_child(inputBoxBin)

    return searchInputBox
  }

  _createButtonBox () {
    const buttonBox = new St.BoxLayout({
      style_class: 'button-box',
      x_align: Clutter.ActorAlign.END
    })

    const refreshIconButton = new IconButton({
      style_class: 'refresh-icon',
      icon_name: 'view-refresh-symbolic',
      icon_size: 18,
      onClick: () => this.emit('refresh')
    })

    const settingsIconButton = new IconButton({
      style_class: 'settings-icon',
      icon_name: 'emblem-system-symbolic',
      icon_size: 18,
      onClick: () => {
        const extensionObject = Extension.lookupByURL(import.meta.url);
        this._mainEventHandler.emit('hide-panel')
        extensionObject.openPreferences();
      }
    })

    buttonBox.add_child(refreshIconButton)
    buttonBox.add_child(settingsIconButton)

    return buttonBox
  }

  _onDestroy () {
  }
})
