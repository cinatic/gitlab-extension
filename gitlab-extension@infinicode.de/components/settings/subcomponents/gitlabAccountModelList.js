const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Gio, GObject } = imports.gi

const { GitlabAccountItem } = Me.imports.components.settings.subcomponents.gitlabAccountItem

const { SettingsHandler, GITLAB_ACCOUNTS, DEFAULT_GITLAB_DATA } = Me.imports.helpers.settings
const { Translations } = Me.imports.helpers.translations

const SETTING_KEYS_TO_REFRESH = [
  GITLAB_ACCOUNTS
]

var GitlabAccountModelList = GObject.registerClass({
  GTypeName: 'GitlabExtension-GitlabAccountModelList',
}, class GitlabAccountModelList extends GObject.Object {
  static [GObject.interfaces] = [Gio.ListModel]

  #items = []
  #changedId

  constructor () {
    super()

    this._settings = new SettingsHandler()

    this.#items = this.convert_items()

    this.#changedId =
        this._settings.connect('changed', (value, key) => {
          if (!SETTING_KEYS_TO_REFRESH.includes(key)) {
            return
          }

          const removed = this.#items.length

          this.#items = this.convert_items()

          this.items_changed(0, removed, this.#items.length)
        })
  }

  convert_items () {
    return this._settings.gitlab_accounts.map(item => {
      const gitlabAccountItem = new GitlabAccountItem()

      gitlabAccountItem.id = item.id || Gio.dbus_generate_guid()
      gitlabAccountItem.name = item.name
      gitlabAccountItem.apiEndpoint = item.apiEndpoint
      gitlabAccountItem.token = item.token
      gitlabAccountItem.onlyOwnedProjects = item.onlyOwnedProjects

      return gitlabAccountItem
    })
  }

  append () {
    const name = Translations.SETTINGS.DEFAULT_NAME.format(this.#items.length + 1)

    const newListItem = new GitlabAccountItem()

    newListItem.id = Gio.dbus_generate_guid()
    newListItem.name = name
    newListItem.apiEndpoint = DEFAULT_GITLAB_DATA.apiEndpoint
    newListItem.token = ''
    newListItem.onlyOwnedProjects = DEFAULT_GITLAB_DATA.onlyOwnedProjects

    this.#items.push(newListItem)

    // https://gitlab.gnome.org/GNOME/gnome-shell-extensions/-/issues/390
    // this does not cause scroll to top / whole list refresh
    this.items_changed(this.#items.length - 1, 0, 1)

    this.save_items()
  }

  remove (id) {
    const pos = this.#items.findIndex(item => item.id === id)

    if (pos === -1) {
      return
    }

    this.#items.splice(pos, 1)

    // https://gitlab.gnome.org/GNOME/gnome-shell-extensions/-/issues/390
    // this does cause scroll to top / whole list refresh
    this.items_changed(pos, 1, 0)

    this.save_items()
  }

  edit (id, name, apiEndpoint, onlyOwnedProjects, token) {
    const pos = this.#items.findIndex(item => item.id === id)

    if (pos === -1) {
      return
    }

    const [modifiedItem] = this.#items.splice(pos, 1)
    this.items_changed(pos, 1, 0)

    modifiedItem.name = name
    modifiedItem.apiEndpoint = apiEndpoint
    modifiedItem.token = token
    modifiedItem.onlyOwnedProjects = onlyOwnedProjects

    this.#items.splice(pos, 0, modifiedItem)

    this.items_changed(pos, 0, 1)

    this.save_items()
  }

  move (movingItemId, targetId) {
    const movingItemPos = this.#items.findIndex(item => item.id === movingItemId)
    const targetPos = this.#items.findIndex(item => item.id === targetId)

    if (movingItemPos < 0 || targetPos < 0) {
      return
    }

    const [movedItem] = this.#items.splice(movingItemPos, 1)
    this.items_changed(movingItemPos, 1, 0)

    this.#items.splice(targetPos, 0, movedItem)
    this.items_changed(targetPos, 0, 1)

    this.save_items()
  }

  save_items () {
    this._settings.gitlab_accounts = this.#items
  }

  vfunc_get_item_type () {
    return GitlabAccountItem
  }

  vfunc_get_n_items () {
    return this.#items.length
  }

  vfunc_get_item (pos) {
    return this.#items[pos]
  }
})
