const { GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Settings } = Me.imports.helpers.settings

var ProjectSelectButtons = GObject.registerClass({}, class ProjectSelectButtons extends St.BoxLayout {
  _init () {
    super._init({
      style_class: 'project-select-buttons'
    })

    Settings.connect('changed', (value, key) => {
      if (key === 'gitlab-accounts' || key === 'selected-gitlab-account-index') {
        this._sync()
      }
    })

    this._sync()
  }

  async _sync () {
    this._createButtons()
  }

  _createButtons () {
    this.destroy_all_children()

    const gitlabAccounts = Settings.gitlab_accounts

    gitlabAccounts.forEach((gitlabAccount, index) => {
      const additionalStyleClasses = index === Settings.selected_gitlab_account_index ? 'active' : ''

      const gitlabAccountButton = new St.Button({
        style_class: `message button ${additionalStyleClasses}`,
        label: gitlabAccount.name,
      })

      gitlabAccountButton.connect('clicked', () => {
        Settings.selected_gitlab_account_index = index
      })

      this.add_child(gitlabAccountButton)
    })
  }
})
