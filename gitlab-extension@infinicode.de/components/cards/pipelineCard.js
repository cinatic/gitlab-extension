const { Gio, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { IconButton } = Me.imports.components.buttons.iconButton
const { Icon } = Me.imports.components.icon.icon
const { Translations } = Me.imports.helpers.translations

const DataHelper = Me.imports.helpers.data

var PipelineCard = GObject.registerClass({}, class PipelineCard extends St.Button {
  _init (pipelineItem, commit) {
    super._init({
      style_class: 'card message pipeline-card',
      can_focus: true,
      x_expand: true,
      y_expand: true,
      hover: true
    })

    this.cardItem = pipelineItem
    this.cardItem.commit = commit || {}

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
  }

  _createCardHeader () {
    const headerBox = new St.BoxLayout({
      style_class: 'header-box',
      x_expand: true,
      y_expand: true
    })

    const leftBox = this._createPipelineInfo()
    const rightBox = this._createHeaderInfoSection()

    headerBox.add_child(leftBox)
    headerBox.add_child(rightBox)

    return headerBox
  }

  _createPipelineInfo () {
    const pipelineInfoBin = new St.Bin({
      style_class: 'commit-info-bin',
      x_expand: true,
      y_expand: true,
      child: new St.Label({
        style_class: 'commit-info-label',
        text: `${this.cardItem.ref} - ${this.cardItem.commit.short_id || this.cardItem.sha.substring(0, 8)}`
      })
    })

    return pipelineInfoBin
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
      text: Translations.LAST_UPDATED.format(DataHelper.getHumanReadableData(this.cardItem.updated_at))
    })

    headerInfoSection.add_child(lastModifiedLabel)

    if (this.cardItem.status) {
      const statusIcon = new Icon({
        icon_name: DataHelper.getPipelineStatusIconName(this.cardItem.status),
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
        text: this.cardItem.commit.title || this.cardItem.sha
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

  _onDestroy () {
  }
})
