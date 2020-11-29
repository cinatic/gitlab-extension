const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { CommitCard } = Me.imports.components.cards.commitCard
const { FlatList } = Me.imports.components.flatList.flatList
const { PipelineCard } = Me.imports.components.cards.pipelineCard
const { ProjectCard } = Me.imports.components.cards.projectCard
const { SearchBar } = Me.imports.components.searchBar.searchBar
const { Translations } = Me.imports.helpers.translations

const GitLabService = Me.imports.services.gitlab

const TABS = {
  COMMITS: 'commits',
  PIPELINES: 'pipelines'
}

var ProjectDetailsScreen = GObject.registerClass({}, class ProjectDetailsScreen extends St.BoxLayout {
  _init (projectItem) {
    super._init({
      style_class: 'screen project-details-screen',
      vertical: true
    })

    this._selectedTab = TABS.COMMITS

    this.projectItem = projectItem

    const searchBar = new SearchBar({
      back_screen_name: 'projects'
    })

    // Static Details Header // TODO: don't be lazy and create a own component for it -.-
    const detailBar = new ProjectCard(this.projectItem)

    // Tab Bar (commits / pipelines)
    this._tabBar = this._createTabBar()

    // Result list
    this._list = new FlatList()

    this.add_child(searchBar)
    this.add_child(detailBar)
    this.add_child(this._tabBar)
    this.add_child(this._list)

    this._sync()

    searchBar.connect('refresh', () => this._sync())
    searchBar.connect('text-change', (sender, searchText) => this._filter_results(searchText))
  }

  _createTabBar () {
    const tabBarBox = new St.BoxLayout({
      style_class: 'detail-tab-bar-box',
      vertical: false,
      x_expand: true,
      x_align: Clutter.ActorAlign.CENTER
    })

    const commitTab = new St.Button({
      style_class: 'button',
      label: Translations.COMMITS
    })

    commitTab.tabIdentifier = TABS.COMMITS
    commitTab.connect('clicked', () => {
      this._selectedTab = TABS.COMMITS
      this._sync()
    })

    const pipelineTab = new St.Button({
      style_class: 'button',
      label: Translations.PIPELINES
    })

    pipelineTab.tabIdentifier = TABS.PIPELINES
    pipelineTab.connect('clicked', () => {
      this._selectedTab = TABS.PIPELINES
      this._sync()
    })

    tabBarBox.add_child(commitTab)
    tabBarBox.add_child(pipelineTab)

    return tabBarBox
  }

  // TODO: next version :)
  // _createBranchBar () {
  //   this.scroll = new St.ScrollView({
  //     style_class: 'branch-bar'
  //   })
  //
  //   this.box = new St.BoxLayout({
  //     style_class: 'scrollable-branch',
  //     vertical: false
  //   })
  //
  //   this.scroll.add_actor(this.box, { expand: false, x_fill: false, x_align: St.Align.LEFT })
  // }

  _extract_filterable_search_text (commit, pipeline) {
    let searchableText = ''

    if (commit) {
      searchableText += `${commit.title || ''} ${commit.author_name} ${commit.author_email} ${commit.id} ${commit.message}`
    }

    if (pipeline) {
      searchableText += ` ${pipeline.ref}`
    }

    return searchableText.toUpperCase()
  }

  _filter_results (searchText) {
    const listItems = this._list.items

    listItems.forEach(item => {
      const data = item.cardItem

      if (!searchText) {
        item.visible = true
        return
      }

      let searchContent

      if (this._selectedTab === TABS.COMMITS) {
        searchContent = this._extract_filterable_search_text(data, data.pipeline)
      } else if (this._selectedTab === TABS.PIPELINES) {
        searchContent = this._extract_filterable_search_text(data.commit, data)
      }

      item.visible = searchContent && searchContent.includes(searchText.toUpperCase())
    })
  }

  async _loadCommits () {
    this._list.show_loading_info()

    const [commitsResponse, pipelineResponse] = await Promise.all([
      GitLabService.getCommits({ projectId: this.projectItem.id, per_page: 50 }),
      GitLabService.getPipelines({ projectId: this.projectItem.id, per_page: 100 })
    ])

    if (!commitsResponse.ok) {
      this._list.show_error_info(Translations.LOADING_DATA_ERROR_SPECIFIC.format('commits', `${commitsResponse.statusText} - ${commitsResponse.text()}`))
      return
    }

    if (!pipelineResponse.ok) {
      this._list.show_error_info(Translations.LOADING_DATA_ERROR_SPECIFIC.format('pipelines', `${pipelineResponse.statusText} - ${pipelineResponse.text()}`))
      return
    }

    this._list.clear_list_items()

    const pipelines = pipelineResponse.json()
    const commits = commitsResponse.json()

    commits.forEach((commit, index) => {
      const pipeline = pipelines.find(pipeline => commit.id === pipeline.sha)

      this._list.addItem(new CommitCard(commit, pipeline))
    })
  }

  async _loadPipelines () {
    this._list.show_loading_info()

    const [pipelineResponse, commitsResponse] = await Promise.all([
      GitLabService.getPipelines({ projectId: this.projectItem.id }),
      GitLabService.getCommits({ projectId: this.projectItem.id, per_page: 50 })
    ])

    if (!pipelineResponse.ok) {
      this._list.show_error_info(Translations.LOADING_DATA_ERROR_SPECIFIC.format('pipelines', `${pipelineResponse.statusText} - ${pipelineResponse.text()}`))
      return
    }

    if (!commitsResponse.ok) {
      this._list.show_error_info(Translations.LOADING_DATA_ERROR_SPECIFIC.format('commits', `${commitsResponse.statusText} - ${commitsResponse.text()}`))
      return
    }

    this._list.clear_list_items()

    const pipelines = pipelineResponse.json()
    const commits = commitsResponse.json()

    pipelines.forEach(pipeline => {
      const commit = commits.find(commit => commit.id === pipeline.sha)
      this._list.addItem(new PipelineCard(pipeline, commit))
    })
  }

  _sync () {
    const tabButtons = this._tabBar.get_children()
    tabButtons.forEach(item => {
      item.style_class = item.style_class.replace('active', '')
    })

    // highlight tab button
    const selectedButton = tabButtons.find(item => item.tabIdentifier === this._selectedTab)
    selectedButton.style_class = `${selectedButton.style_class} active`

    // refresh data
    if (this._selectedTab === TABS.COMMITS) {
      this._loadCommits()
    } else if (this._selectedTab === TABS.PIPELINES) {
      this._loadPipelines()
    }
  }
})
