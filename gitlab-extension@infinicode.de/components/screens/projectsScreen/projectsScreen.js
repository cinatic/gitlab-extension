import GObject from 'gi://GObject'
import St from 'gi://St'

import { clearCache } from '../../../helpers/data.js'
import { FlatList } from '../../flatList/flatList.js'
import { ProjectSelectButtons } from '../../gitlab/projectSelectButtons.js'
import { ProjectCard } from '../../cards/projectCard.js'
import { SearchBar } from '../../searchBar/searchBar.js'

import {
  SettingsHandler,
  GITLAB_ACCOUNTS,
  SELECTED_GITLAB_ACCOUNT_INDEX
} from '../../../helpers/settings.js'

import { Translations } from '../../../helpers/translations.js'

import * as GitLabService from '../../../services/gitlab.js'

const SETTINGS_KEYS_TO_REFRESH = [
  GITLAB_ACCOUNTS,
  SELECTED_GITLAB_ACCOUNT_INDEX
]

export const ProjectsScreen = GObject.registerClass({}, class ProjectsScreen extends St.BoxLayout {
  _init (mainEventHandler) {
    super._init({
      style_class: 'screen projects-screen',
      vertical: true
    })

    this._mainEventHandler = mainEventHandler
    this._settings = new SettingsHandler()

    this._settingsChangedId = null

    const searchBar = new SearchBar({ mainEventHandler: this._mainEventHandler })
    this._list = new FlatList()

    this.add_child(searchBar)

    this._projectSelectButtons = new ProjectSelectButtons()
    this._projectSelectButtons.visible = this._settings.gitlab_accounts.length > 1
    this.add_child(this._projectSelectButtons)

    this.add_child(this._list)

    searchBar.connect('refresh', () => {
      clearCache()
      this._loadData().catch(e => log(e))
    })

    searchBar.connect('text-change', (sender, searchText) => this._filter_results(searchText))

    this._settingsChangedId = this._settings.connect('changed', (value, key) => {
      if (SETTINGS_KEYS_TO_REFRESH.includes(key)) {
        this._loadData().catch(e => log(e))
      }

      this._projectSelectButtons.visible = this._settings.gitlab_accounts.length > 1
    })

    this._list.connect('clicked-item', (sender, item) => this._mainEventHandler.emit('show-screen', {
      screen: 'project-details',
      additionalData: {
        item: item.cardItem
      }
    }))

    this.connect('destroy', this._onDestroy.bind(this))

    this._loadData().catch(e => log(e))
  }

  _filter_results (searchText) {
    const listItems = this._list.items

    listItems.forEach(item => {
      const data = item.cardItem

      if (!searchText) {
        item.visible = true
        return
      }

      const searchContent = `${data.name} ${data.path_with_namespace}`.toUpperCase()

      item.visible = searchContent.includes(searchText.toUpperCase())
    })
  }

  async _loadData () {
    if (!this._settings.selected_gitlab_account) {
      this._list.show_error_info(Translations.TOKEN_ERROR)
      return
    }

    this._list.show_loading_info()

    const response = await GitLabService.getOwnedProjects({ per_page: 50 })

    if (!response.ok) {
      this._list.show_error_info(Translations.LOADING_DATA_ERROR_SPECIFIC.format('projects', `${response.statusText} - ${response.text()}`))
      return
    }

    const projects = response.json()

    // load extra data for the first 6 projects
    // CAREFUL: gitlab has a limit of 10 req /s
    const top6ProjectPipelines = await Promise.all(projects.slice(0, 6).map(project => GitLabService.getPipelines({ projectId: project.id, per_page: 1 })))

    this._list.clear_list_items()

    projects.forEach((project, index) => {
      let latestPipeline
      const pipelinesResponse = top6ProjectPipelines[index]

      if (pipelinesResponse) {
        latestPipeline = (pipelinesResponse.json() || [])[0]
      }

      this._list.addItem(new ProjectCard(project, latestPipeline), true)
    })
  }

  _onDestroy () {
    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId)
    }
  }
})
