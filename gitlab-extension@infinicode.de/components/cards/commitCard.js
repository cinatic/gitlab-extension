const { Gio, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { IconButton } = Me.imports.components.buttons.iconButton
const { Icon } = Me.imports.components.icon.icon
const { Translations } = Me.imports.helpers.translations

const DataHelper = Me.imports.helpers.data

var CommitCard = GObject.registerClass({}, class CommitCard extends St.Button {
  _init (commitItem, pipeline) {
    super._init({
      style_class: 'card message commit-card',
      can_focus: true,
      x_expand: true,
      y_expand: true,
      hover: true
    })

    this.cardItem = commitItem
    this.cardItem.pipeline = pipeline

    let vContentBox = new St.BoxLayout({
      vertical: true,
      x_expand: true
    })
    this.set_child(vContentBox)

    const cardHeaderBox = this._createCardHeader()
    const cardContentBox = this._createCardContent()

    vContentBox.add_child(cardHeaderBox)
    vContentBox.add_child(cardContentBox)

    this.connect('destroy', this._onDestroy.bind(this))
    this._sync()
  }

  _createCardHeader () {
    const headerBox = new St.BoxLayout({
      style_class: 'header-box',
      x_expand: true,
      y_expand: true
    })

    const leftBox = this._createCommitInfo()
    const rightBox = this._createHeaderInfoSection()

    headerBox.add_child(leftBox)
    headerBox.add_child(rightBox)

    return headerBox
  }

  _createCommitInfo () {
    const commitInfoBin = new St.Bin({
      style_class: 'commit-info-bin',
      x_expand: true,
      y_expand: true,
      child: new St.Label({
        style_class: 'commit-info-label',
        text: `${this.cardItem.author_name} - ${this.cardItem.short_id}`
      })
    })

    return commitInfoBin
  }

  _createHeaderInfoSection () {
    let headerInfoSection = new St.BoxLayout({
      style_class: 'info-section-box',
      x_expand: false,
      y_expand: false,
      x_align: St.Align.END
    })

    const lastModifiedLabel = new St.Label({
      style_class: 'modified-at',
      text: Translations.LAST_UPDATED.format(DataHelper.getHumanReadableData(this.cardItem.created_at))
    })

    headerInfoSection.add_child(lastModifiedLabel)

    if (this.cardItem.pipeline) {
      const statusIcon = new Icon({
        icon_name: DataHelper.getPipelineStatusIconName(this.cardItem.pipeline.status),
        style_class: 'pipeline-status-icon',
        isCustomIcon: true,
        icon_size: 16
      })

      headerInfoSection.add_child(statusIcon)
    }

    return headerInfoSection
  }

  _createCardContent () {
    let projectInfoBox = new St.BoxLayout({
      style_class: 'card-content-box',
      x_expand: true,
      y_expand: true
    })

    const leftBox = this._createCommitName()
    const rightBox = this._createLinkIcon()

    projectInfoBox.add_child(leftBox)
    projectInfoBox.add_child(rightBox)

    return projectInfoBox
  }

  _createCommitName () {
    const commitTitleBin = new St.Bin({
      style_class: 'commit-title-bin',
      x_expand: true,
      y_expand: true,
      child: new St.Label({
        style_class: 'commit-title-label',
        text: this.cardItem.title
      })
    })

    return commitTitleBin
  }

  _createLinkIcon () {
    const linkIconBin = new St.Bin({
      style_class: 'link-icon-bin',
      x_expand: false,
      y_expand: false,
      x_align: St.Align.END,
      child: new IconButton({
        icon_name: 'open-link-symbolic',
        isCustomIcon: true,
        icon_size: 20,
        onClick: () => Gio.AppInfo.launch_default_for_uri_async(this.cardItem.web_url, null, null, null)
      })
    })

    return linkIconBin
  }

  _sync () {
    // let visible = this.hover && this.canClose()
    // this._closeButton.opacity = visible ? 255 : 0
    // this._closeButton.reactive = visible
  }

  _onDestroy () {
  }
})
