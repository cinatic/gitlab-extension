const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gio, GObject, Gtk } = imports.gi

const { SettingsHandler } = Me.imports.helpers.settings
const { Translations } = Me.imports.helpers.translations

const { NewItemModel } = Me.imports.components.settings.subcomponents.newItemModel
const { NewGitlabAccountRow } = Me.imports.components.settings.subcomponents.newGitlabAccountRow
const { GitlabAccountModelList } = Me.imports.components.settings.subcomponents.gitlabAccountModelList
const { GitlabAccountRow } = Me.imports.components.settings.subcomponents.gitlabAccountRow

var GitlabAccountListPage = GObject.registerClass({
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
