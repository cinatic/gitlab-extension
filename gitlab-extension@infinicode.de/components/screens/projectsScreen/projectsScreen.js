const { GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { EventHandler } = Me.imports.helpers.eventHandler
const { FlatList } = Me.imports.components.flatList.flatList
const { ProjectCard } = Me.imports.components.cards.projectCard
const { SearchBar } = Me.imports.components.searchBar.searchBar
const { Settings } = Me.imports.helpers.settings
const { Translations } = Me.imports.helpers.translations

const GitlabService = Me.imports.services.gitlab

var ProjectsScreen = GObject.registerClass({}, class ProjectsScreen extends St.BoxLayout {
  _init () {
    super._init({
      style_class: 'projects-screen',
      vertical: true,
      x_expand: true,
      y_expand: true
    })

    const searchBar = new SearchBar()
    this._list = new FlatList()

    this.add_child(searchBar)
    this.add_child(this._list)

    searchBar.connect('refresh', () => this._loadData())
    searchBar.connect('text-change', (sender, searchText) => this._filter_results(searchText))

    this._list.connect('clicked-item', (sender, item) => EventHandler.emit('show-screen', {
      screen: 'project-details',
      additionalData: {
        item: item.cardItem
      }
    }))

    this._loadData()
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
    if (!Settings.gitlab_token) {
      this._list.show_error_info(Translations.TOKEN_ERROR)
      return
    }

    this._list.show_loading_info()

    const response = await GitlabService.getOwnedProjects({ per_page: 50 })

    if (!response.ok) {
      this._list.show_error_info(Translations.LOADING_DATA_ERROR_SPECIFIC.format('projects', `${response.statusText} - ${response.text()}`))
      return
    }

    const projects = response.json()

    // load extra data for the first 6 projects
    // CAREFUL: gitlab has a limit of 10 req /s
    const top6ProjectPipelines = await Promise.all(projects.slice(0, 6).map(project => GitlabService.getPipelines({ projectId: project.id, per_page: 1 })))

    this._list.clear_list_items()

    projects.forEach((project, index) => {
      let latestPipeline
      const pipelinesResponse = top6ProjectPipelines[index]

      if (pipelinesResponse) {
        latestPipeline = (pipelinesResponse.json() || [])[0]
      }

      this._list.addItem(new ProjectCard(project, latestPipeline))
    })
  }
})
