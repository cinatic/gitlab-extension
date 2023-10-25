import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk'


import { Translations } from '../../helpers/translations.js'

import { NewItemModel } from './subcomponents/newItemModel.js'
import { NewGitlabAccountRow } from './subcomponents/newGitlabAccountRow.js'
import { GitlabAccountModelList } from './subcomponents/gitlabAccountModelList.js'
import { GitlabAccountRow } from './subcomponents/gitlabAccountRow.js'

export const GitlabAccountListPage = GObject.registerClass({
      GTypeName: 'GitlabExtension-GitlabAccountListPage',
    },
    class GitlabAccountListPreferencePage extends Adw.PreferencesPage {
      _init () {
        super._init({
          title: Translations.SETTINGS.TITLE_ACCOUNTS,
          icon_name: 'view-list-symbolic',
          name: 'GitlabAccountListPage'
        })

        const preferenceGroup = new GitlabAccountListPreferenceGroup()
        this.add(preferenceGroup)
      }
    })

class GitlabAccountListPreferenceGroup extends Adw.PreferencesGroup {
  static {
    GObject.registerClass({ GTypeName: 'GitlabExtension-GitlabAccountListPreferenceGroup' }, this)

    this.install_action('account.add', null, self => self._gitlabAccountModelList.append())
    this.install_action('account.remove', 's', (self, name, param) => self._gitlabAccountModelList.remove(param.unpack()))
    this.install_action('account.edit', '(ss)', (self, name, param) => {
      const data = param.deepUnpack()

      self._gitlabAccountModelList.edit(...data)
    })
  }

  constructor () {
    super({
      title: Translations.SETTINGS.TITLE_ACCOUNT_LIST,
    })

    this._gitlabAccountModelList = new GitlabAccountModelList()

    const store = new Gio.ListStore({ item_type: Gio.ListModel })
    const listModel = new Gtk.FlattenListModel({ model: store })
    store.append(this._gitlabAccountModelList)
    store.append(new NewItemModel())

    this._list = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ['boxed-list'],
    })
    this._list.connect('row-activated', (l, row) => row.edit())
    this.add(this._list)

    this._list.bind_model(listModel, item => {
      return !item.id
          ? new NewGitlabAccountRow()
          : new GitlabAccountRow(item, this._gitlabAccountModelList)
    })
  }
}
