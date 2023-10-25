import GObject from 'gi://GObject'
import St from 'gi://St'

import { SettingsHandler } from '../../helpers/settings.js'

export const ProjectSelectButtons = GObject.registerClass({}, class ProjectSelectButtons extends St.BoxLayout {
  _init () {
    super._init({
      style_class: 'project-select-buttons'
    })

    this._settings = new SettingsHandler()

    this._settingsChangedId = this._settings.connect('changed', (value, key) => {
      if (key === 'gitlab-accounts' || key === 'selected-gitlab-account-index') {
        this._sync()
      }
    })

    this.connect('destroy', this._onDestroy.bind(this))

    this._sync()
  }

  async _sync () {
    this._createButtons()
  }

  _createButtons () {
    this.destroy_all_children()

    const gitlabAccounts = this._settings.gitlab_accounts

    gitlabAccounts.forEach((gitlabAccount, index) => {
      const additionalStyleClasses = index === this._settings.selected_gitlab_account_index ? 'active' : ''

      const gitlabAccountButton = new St.Button({
        style_class: `message button ${additionalStyleClasses}`,
        label: gitlabAccount.name
      })

      gitlabAccountButton.connect('clicked', () => {
        this._settings.selected_gitlab_account_index = index
      })

      this.add_child(gitlabAccountButton)
    })
  }

  _onDestroy () {
    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId)
    }
  }
})
