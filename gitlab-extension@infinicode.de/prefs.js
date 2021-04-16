const { Gio, Gtk, GObject } = imports.gi

const Config = imports.misc.config
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { getSettings, Settings } = Me.imports.helpers.settings
const { initTranslations, Translations } = Me.imports.helpers.translations

const EXTENSIONDIR = Me.dir.get_path()

var PrefsWidget = GObject.registerClass({
  GTypeName: 'GitLabExtensionPrefsWidget'
}, class Widget extends Gtk.Box {

  _init (params = {}) {
    super._init(Object.assign(params, {
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 0
    }))

    this.Window = new Gtk.Builder()

    this.loadConfig()
    this.initWindow()

    if (isGnome4()) {
      this.append(this.MainWidget)
    } else {
      this.add(this.MainWidget)
    }
  }

  initWindow () {
    let uiFile = EXTENSIONDIR + '/settings.ui'

    if (isGnome4()) {
      uiFile = EXTENSIONDIR + '/settings_40.ui'
    }

    this.Window.add_from_file(uiFile)
    this.MainWidget = this.Window.get_object('main-widget')

    const gtkConfigObjects = this.Window.get_objects()

    gtkConfigObjects.forEach(gtkWidget => {
      const gtkUiIdentifier = getWidgetUiIdentifier(gtkWidget)
      const widgetType = getWidgetType(gtkWidget)

      if (gtkUiIdentifier && (gtkUiIdentifier.startsWith('new-') || gtkUiIdentifier.startsWith('edit-'))) {
        return
      }

      switch (widgetType) {
        case 'GtkComboBoxText':
          this.initComboBox(gtkWidget, gtkUiIdentifier)
          break

        case 'GtkSwitch':
          this.initSwitch(gtkWidget, gtkUiIdentifier)
          break

        case 'GtkSpinButton':
          this.initSpinner(gtkWidget, gtkUiIdentifier)
          break
      }
    })

    if (Me.metadata.version !== undefined) {
      this.Window.get_object('version').set_label(Me.metadata.version.toString())
    }

    this._initTreeView()
    this.recreateTreeViewColumns()
  }

  loadConfig () {
    this.Settings = getSettings()
  }

  initSpinner (gtkWidget, identifier) {
    this.Settings.bind(identifier, gtkWidget, 'value', Gio.SettingsBindFlags.DEFAULT)
  }

  initComboBox (gtkWidget, identifier) {
    this.Settings.bind(identifier, gtkWidget, 'active-id', Gio.SettingsBindFlags.DEFAULT)
  }

  initSwitch (gtkWidget, identifier) {
    this.Settings.bind(identifier, gtkWidget, 'active', Gio.SettingsBindFlags.DEFAULT)
  }

  _initTreeView () {
    this.treeview = this.Window.get_object('tree-treeview')
    this.liststore = this.Window.get_object('tree-liststore')

    this.createGitLabAccountWidget = this.Window.get_object('create-gitlab-account-widget')
    this.newAccountNameInput = this.Window.get_object('create-gitlab-account-name-input')
    this.newAccountTokenInput = this.Window.get_object('create-gitlab-account-token-input')
    this.newAccountApiEndpointInput = this.Window.get_object('create-gitlab-account-api-endpoint-input')

    this.editGitLabAccountWidget = this.Window.get_object('edit-gitlab-account-widget')
    this.editAccountNameInput = this.Window.get_object('edit-gitlab-account-name-input')
    this.editAccountTokenInput = this.Window.get_object('edit-gitlab-account-token-input')
    this.editAccountApiEndpointInput = this.Window.get_object('edit-gitlab-account-api-endpoint-input')

    // TreeView / Table Buttons
    this.Window.get_object('tree-toolbutton-add').connect('clicked', () => {
      this.createGitLabAccountWidget.show()
    })

    this.Window.get_object('tree-toolbutton-remove').connect('clicked', this.removeGitLabAccountItem.bind(this))
    this.Window.get_object('tree-toolbutton-edit').connect('clicked', this.showEditGitLabAccountWidget.bind(this))

    // Create Widget Buttons
    this.Window.get_object('button-create-save').connect('clicked', this.createGitLabAccountItem.bind(this))
    this.Window.get_object('button-create-cancel').connect('clicked', () => {
      this.createGitLabAccountWidget.hide()
    })

    // Edit Widget Buttons
    this.Window.get_object('button-edit-save').connect('clicked', this.updateGitLabAccountItem.bind(this))
    this.Window.get_object('button-edit-cancel').connect('clicked', () => {
      this.editGitLabAccountWidget.hide()
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
    const gitlabAccounts = Settings.gitlab_accounts

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
  showEditGitLabAccountWidget () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (selection === undefined || selection === null) {
      return
    }

    // check if we have data (normally we should otherwise it could not be selected...)
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedItem = Settings.gitlab_accounts[selectionIndex]

    if (!selectedItem) {
      return
    }

    this.editAccountNameInput.set_text(selectedItem.name)
    this.editAccountTokenInput.set_text(selectedItem.token)
    this.editAccountApiEndpointInput.set_text(selectedItem.apiEndpoint)

    this.editGitLabAccountWidget.show()
  }

  /**
   * Save new tree item data
   */
  createGitLabAccountItem () {
    const name = this.newAccountNameInput.get_text().trim()
    const token = this.newAccountTokenInput.get_text().trim()
    const apiEndpoint = this.newAccountApiEndpointInput.get_text().trim()

    const newItem = {
      name,
      token,
      apiEndpoint
    }

    // append new item and write it to config
    Settings.gitlab_accounts = [...Settings.gitlab_accounts, newItem]

    this.recreateTreeViewColumns()

    this.createGitLabAccountWidget.hide()
  }

  /**
   * update tree item data
   */
  updateGitLabAccountItem () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (selection === undefined || selection === null) {
      return
    }

    const gitlabAccounts = Settings.gitlab_accounts
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
    Settings.gitlab_accounts = gitlabAccounts

    this.recreateTreeViewColumns()

    this.editGitLabAccountWidget.hide()
  }

  /**
   * Remove tree item
   */
  removeGitLabAccountItem () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (selection === undefined || selection === null) {
      return
    }

    const gitlabAccounts = Settings.gitlab_accounts
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedItem = gitlabAccounts[selectionIndex]

    if (!selectedItem) {
      return
    }

    gitlabAccounts.splice(selectionIndex, 1)

    Settings.gitlab_accounts = gitlabAccounts

    this.recreateTreeViewColumns()
  }
})

const getWidgetUiIdentifier = gtkWidget => {
  if (isGnome4()) {
    return gtkWidget.get_buildable_id ? gtkWidget.get_buildable_id() : null
  }

  return gtkWidget.get_name ? gtkWidget.get_name() : null
}

const getWidgetType = gtkWidget => {
  if (isGnome4()) {
    return gtkWidget.get_name ? gtkWidget.get_name() : null
  }

  const classPaths = gtkWidget.class_path ? gtkWidget.class_path()[1] : []

  if (classPaths.indexOf('GtkSwitch') !== -1) {
    return 'GtkSwitch'
  } else if (classPaths.indexOf('GtkComboBoxText') !== -1) {
    return 'GtkComboBoxText'
  } else if (classPaths.indexOf('GtkSpinButton') !== -1) {
    return 'GtkSpinButton'
  }
}

const isGnome4 = () => Config.PACKAGE_VERSION.startsWith('4')

// this is called when settings has been opened
var init = () => {
  initTranslations(Settings.SETTINGS_SCHEMA_DOMAIN)
}

function buildPrefsWidget () {
  let widget = new PrefsWidget()
  widget.show()
  return widget
}
