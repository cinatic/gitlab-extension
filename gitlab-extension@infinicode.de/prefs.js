const { GLib, Gtk, GObject } = imports.gi

const Mainloop = imports.mainloop
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { decodeBase64JsonOrDefault } = Me.imports.helpers.data
const Settings = Me.imports.helpers.settings
const { initTranslations, Translations } = Me.imports.helpers.translations

const EXTENSIONDIR = Me.dir.get_path()

const POSITION_IN_PANEL_KEY = 'position-in-panel'
const GITLAB_TOKEN = 'gitlab-token'
const GITLAB_ACCOUNTS = 'gitlab-accounts'

let inRealize = false

let defaultSize = [-1, -1]

let i = 0
var PrefsWidget = GObject.registerClass({
  GTypeName: 'GitlabExtensionPrefsWidget'
}, class Widget extends Gtk.Box {

  _init (params = {}) {
    super._init(Object.assign(params, {
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 0
    }))

    this.configWidgets = []
    this.Window = new Gtk.Builder()

    this.initWindow()

    defaultSize = this.MainWidget.get_size_request()
    let borderWidth = this.MainWidget.get_border_width()

    defaultSize[0] += 2 * borderWidth
    defaultSize[1] += 2 * borderWidth

    this.MainWidget.set_size_request(-1, -1)
    this.MainWidget.set_border_width(0)

    this.evaluateValues()

    this.add(this.MainWidget)

    this.MainWidget.connect('realize', () => {
      if (inRealize) {
        return
      }
      inRealize = true

      this.MainWidget.get_toplevel().resize(defaultSize[0], defaultSize[1])
      inRealize = false
    })
  }

  initWindow () {
    this.Window.add_from_file(EXTENSIONDIR + '/settings.ui')

    this.MainWidget = this.Window.get_object('main-widget')

    let theObjects = this.Window.get_objects()
    for (let i in theObjects) {
      let name = theObjects[i].get_name ? theObjects[i].get_name() : 'dummy'

      if (this[name] !== undefined) {
        if (theObjects[i].class_path()[1].indexOf('GtkEntry') != -1) {
          this.initEntry(theObjects[i])
        } else if (theObjects[i].class_path()[1].indexOf('GtkComboBoxText') != -1) {
          this.initComboBox(theObjects[i])
        } else if (theObjects[i].class_path()[1].indexOf('GtkSwitch') != -1) {
          this.initSwitch(theObjects[i])
        } else if (theObjects[i].class_path()[1].indexOf('GtkScale') != -1) {
          this.initScale(theObjects[i])
        }

        this.configWidgets.push([theObjects[i], name])
      }
    }

    if (Me.metadata.version !== undefined) {
      this.Window.get_object('version').set_label(Me.metadata.version.toString())
    }

    this._initTreeView()
  }

  clearEntry () {
    arguments[0].set_text('')
  }

  initEntry (theEntry) {
    let name = theEntry.get_name()
    theEntry.text = this[name]
    if (this[name].length != 32) {
      theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning')
    }

    theEntry.connect('notify::text', () => {
      let key = arguments[0].text
      this[name] = key
      if (key.length == 32) {
        theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, '')
      } else {
        theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning')
      }
    })
  }

  initComboBox (theComboBox) {
    let name = theComboBox.get_name()
    theComboBox.connect('changed', () =>
        this[name] = arguments[0].active
    )
  }

  initSwitch (theSwitch) {
    let name = theSwitch.get_name()

    theSwitch.connect('notify::active', () =>
        this[name] = arguments[0].active
    )
  }

  initScale (theScale) {
    let name = theScale.get_name()
    theScale.set_value(this[name])
    this[name + 'Timeout'] = undefined
    theScale.connect('value-changed', (slider) => {
      if (this[name + 'Timeout'] !== undefined) {
        Mainloop.source_remove(this[name + 'Timeout'])
      }
      this[name + 'Timeout'] = Mainloop.timeout_add(250, () => {
        this[name] = slider.get_value()
        return false
      })
    })
  }

  loadConfig () {
    this.Settings = Settings.getSettings()
    this.Settings.connect('changed', this.evaluateValues.bind(this))
  }

  evaluateValues () {
    this.recreateTreeViewColumns()

    const config = this.configWidgets

    for (let i in config) {

      if (config[i][0].active != this[config[i][1]]) {
        config[i][0].active = this[config[i][1]]
      }
    }
  }

  _initTreeView () {
    this.treeview = this.Window.get_object('tree-treeview')
    this.liststore = this.Window.get_object('tree-liststore')

    this.createGitlabAccountWidget = this.Window.get_object('create-gitlab-account-widget')
    this.newAccountNameInput = this.Window.get_object('create-gitlab-account-name-input')
    this.newAccountTokenInput = this.Window.get_object('create-gitlab-account-token-input')
    this.newAccountApiEndpointInput = this.Window.get_object('create-gitlab-account-api-endpoint-input')

    this.editGitlabAccountWidget = this.Window.get_object('edit-gitlab-account-widget')
    this.editAccountNameInput = this.Window.get_object('edit-gitlab-account-name-input')
    this.editAccountTokenInput = this.Window.get_object('edit-gitlab-account-token-input')
    this.editAccountApiEndpointInput = this.Window.get_object('edit-gitlab-account-api-endpoint-input')

    // TreeView / Table Buttons
    this.Window.get_object('tree-toolbutton-add').connect('clicked', () => {
      this.createGitlabAccountWidget.show_all()
    })

    this.Window.get_object('tree-toolbutton-remove').connect('clicked', this.removeGitlabAccountItem.bind(this))
    this.Window.get_object('tree-toolbutton-edit').connect('clicked', this.showEditGitlabAccountWidget.bind(this))

    // Create Widget Buttons
    this.Window.get_object('button-create-save').connect('clicked', this.createGitlabAccountItem.bind(this))
    this.Window.get_object('button-create-cancel').connect('clicked', () => {
      this.createGitlabAccountWidget.hide()
    })

    // Edit Widget Buttons
    this.Window.get_object('button-edit-save').connect('clicked', this.updateGitlabAccountItem.bind(this))
    this.Window.get_object('button-edit-cancel').connect('clicked', () => {
      this.editGitlabAccountWidget.hide()
    })

    this._initTreeViewColumns()
  }

  _initTreeViewColumns () {
    /**** account-name cell ****/
    const accountNameColumn = new Gtk.TreeViewColumn()
    accountNameColumn.set_title(Translations.SETTINGS.ACCOUNT_NAME)
    this.treeview.append_column(accountNameColumn)

    let renderer = new Gtk.CellRendererText()
    accountNameColumn.pack_start(renderer, null)

    accountNameColumn.set_cell_data_func(renderer, (tree, cell, model, iter) => {
      cell.markup = model.get_value(iter, 0)
    })

    /**** token cell ****/
    const tokenColumn = new Gtk.TreeViewColumn()
    tokenColumn.set_title(Translations.SETTINGS.TOKEN)
    this.treeview.append_column(tokenColumn)

    tokenColumn.pack_start(renderer, null)

    tokenColumn.set_cell_data_func(renderer, (tree, cell, model, iter) => {
      cell.markup = model.get_value(iter, 1)
    })

    /**** api-endpoint cell ****/
    const apiEndpointColumn = new Gtk.TreeViewColumn()
    apiEndpointColumn.set_title(Translations.SETTINGS.API_ENDPOINT)
    this.treeview.append_column(apiEndpointColumn)

    apiEndpointColumn.pack_start(renderer, null)

    apiEndpointColumn.set_cell_data_func(renderer, function (tree, cell, model, iter) {
      cell.markup = model.get_value(iter, 2)
    })
  }

  /**
   * this recreates the TreeView (Symbol Table)
   */
  recreateTreeViewColumns () {
    const gitlabAccounts = this.gitlabAccounts

    this.treeview = this.Window.get_object('tree-treeview')
    this.liststore = this.Window.get_object('tree-liststore')

    this.Window.get_object('tree-toolbutton-remove').sensitive = Boolean(gitlabAccounts.length)
    this.Window.get_object('tree-toolbutton-edit').sensitive = Boolean(gitlabAccounts.length)

    if (this.liststore) {
      this.liststore.clear()
    }

    if (gitlabAccounts.length > 0) {

      let current = this.liststore.get_iter_first()

      gitlabAccounts.forEach(accountItem => {

        current = this.liststore.append()
        this.liststore.set_value(current, 0, accountItem.name)
        this.liststore.set_value(current, 1, accountItem.token)
        this.liststore.set_value(current, 2, accountItem.apiEndpoint)
      })
    }
  }

  /**
   * show edit tree item widget
   */
  showEditGitlabAccountWidget () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (selection === undefined || selection === null) {
      return
    }

    // check if we have data (normally we should otherwise it could not be selected...)
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedItem = this.gitlabAccounts[selectionIndex]

    if (!selectedItem) {
      return
    }

    this.editAccountNameInput.set_text(selectedItem.name)
    this.editAccountTokenInput.set_text(selectedItem.token)
    this.editAccountApiEndpointInput.set_text(selectedItem.apiEndpoint)

    this.editGitlabAccountWidget.show_all()
  }

  /**
   * Save new tree item data
   */
  createGitlabAccountItem () {
    const name = this.newAccountNameInput.get_text().trim()
    const token = this.newAccountTokenInput.get_text().trim()
    const apiEndpoint = this.newAccountApiEndpointInput.get_text().trim()

    const newItem = {
      name,
      token,
      apiEndpoint
    }

    // append new item and write it to config
    this.gitlabAccounts = [...this.gitlabAccounts, newItem]

    this.createGitlabAccountWidget.hide()
  }

  /**
   * update tree item data
   */
  updateGitlabAccountItem () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (selection === undefined || selection === null) {
      return
    }

    const gitlabAccounts = this.gitlabAccounts
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedItem = gitlabAccounts[selectionIndex]

    if (!selectedItem) {
      return
    }

    const name = this.editAccountNameInput.get_text().trim()
    const token = this.editAccountTokenInput.get_text().trim()
    const apiEndpoint = this.editAccountApiEndpointInput.get_text().trim()

    const newItem = {
      name,
      token,
      apiEndpoint
    }

    gitlabAccounts[selectionIndex] = newItem
    this.gitlabAccounts = gitlabAccounts

    this.editGitlabAccountWidget.hide()
  }

  /**
   * Remove tree item
   */
  removeGitlabAccountItem () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (selection === undefined || selection === null) {
      return
    }

    const gitlabAccounts = this.gitlabAccounts
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedItem = gitlabAccounts[selectionIndex]

    if (!selectedItem) {
      return
    }

    gitlabAccounts.splice(selectionIndex, 1)

    this.gitlabAccounts = gitlabAccounts
  }

  // The names must be equal to the ID in settings.ui!
  get position_in_panel () {
    if (!this.Settings) {
      this.loadConfig()
    }
    return this.Settings.get_enum(POSITION_IN_PANEL_KEY)
  }

  set position_in_panel (v) {
    if (!this.Settings) {
      this.loadConfig()
    }

    this.Settings.set_enum(POSITION_IN_PANEL_KEY, v)
  }

  get gitlabAccounts () {
    if (!this.Settings) {
      this.loadConfig()
    }

    /****
     * For backwards compatiblity intercept here and check if old token exist
     * if we found old format convert to new format and save
     */
    try {
      const oldToken = this.Settings.get_string(GITLAB_TOKEN)

      if (oldToken) {
        const newData = [
          {
            ...Settings.DEFAULT_GITLAB_DATA,
            token: oldToken
          }]

        this.Settings.set_string(GITLAB_TOKEN, '')
        this.Settings.set_string(GITLAB_ACCOUNTS, GLib.base64_encode(JSON.stringify(newData)))

        return newData
      }
    } catch (e) {
      log(`failed to convert old token ${e}`)
    }

    const rawString = this.Settings.get_string(GITLAB_ACCOUNTS)
    return decodeBase64JsonOrDefault(rawString, [])
  }

  set gitlabAccounts (v) {
    if (!this.Settings) {
      this.loadConfig()
    }

    this.Settings.set_string(GITLAB_ACCOUNTS, GLib.base64_encode(JSON.stringify(v)))
  }
})

// this is called when settings has been opened
var init = () => {
  initTranslations(Settings.SETTINGS_SCHEMA_DOMAIN)
}

function buildPrefsWidget () {
  let widget = new PrefsWidget()
  widget.show_all()
  return widget
}
