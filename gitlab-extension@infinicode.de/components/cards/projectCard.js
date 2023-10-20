import Clutter from 'gi://Clutter'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { IconButton } from '../buttons/iconButton.js'
import { Icon } from '../icon/icon.js'
import { Translations } from '../../helpers/translations.js'

import * as DataHelper from '../../helpers/data.js'

export const ProjectCard = GObject.registerClass({}, class ProjectCard extends St.Button {
  _init (projectItem, pipeline) {
    super._init({
      style_class: 'card message project-card',
      can_focus: true,
      x_expand: true
    })

    this.cardItem = projectItem
    this.cardItem.pipelineItem = pipeline

    let vContentBox = new St.BoxLayout({
      vertical: true,
      x_expand: true
    })
    this.set_child(vContentBox)

    const headerBox = this._createHeader()
    const projectInfoBox = this._createProjectInfo()

    vContentBox.add_child(headerBox)
    vContentBox.add_child(projectInfoBox)

    this.connect('destroy', this._onDestroy.bind(this))
  }

  _createHeader () {
    let headerBox = new St.BoxLayout({
      style_class: 'header-box',
      x_expand: true
    })

    const leftBox = this._createProjectPath()
    const rightBox = this._createHeaderInfoSection()

    headerBox.add_child(leftBox)
    headerBox.add_child(rightBox)

    return headerBox
  }

  _createProjectPath () {
    const projectPathBin = new St.Bin({
      style_class: 'project-path-bin',
      x_expand: true,
      child: new St.Label({ style_class: 'project-path-label', text: this.cardItem.path_with_namespace.replace(/\//g, ' / ') })
    })

    return projectPathBin
  }

  _createHeaderInfoSection () {
    let headerInfoSection = new St.BoxLayout({
      style_class: 'info-section-box',
      x_expand: false,
      x_align: Clutter.ActorAlign.END,
      y_align: Clutter.ActorAlign.CENTER
    })

    const lastModifiedLabel = new St.Label({
      style_class: 'modified-at',
      text: Translations.LAST_UPDATED.format(DataHelper.getHumanReadableData(this.cardItem.last_activity_at))
    })

    headerInfoSection.add_child(lastModifiedLabel)

    if (this.cardItem.pipelineItem) {
      const statusIcon = new Icon({
        icon_name: DataHelper.getPipelineStatusIconName(this.cardItem.pipelineItem.status),
        style_class: 'pipeline-status-icon',
        isCustomIcon: true,
        icon_size: 16
      })

      headerInfoSection.add_child(statusIcon)
    }

    return headerInfoSection
  }

  _createProjectInfo () {
    let projectInfoBox = new St.BoxLayout({
      style_class: 'project-info-box',
      x_expand: true
    })

    const leftBox = this._createProjectName()
    const rightBox = this._createLinkIcon()

    projectInfoBox.add_child(leftBox)
    projectInfoBox.add_child(rightBox)

    return projectInfoBox
  }

  _createProjectName () {
    const projectNameBin = new St.Bin({
      style_class: 'project-name-bin',
      x_expand: true,
      child: new St.Label({ style_class: 'project-name-label', text: this.cardItem.name })
    })

    return projectNameBin
  }

  _createLinkIcon () {
    const linkIconBin = new St.Bin({
      style_class: 'link-icon-bin',
      x_expand: false,
      x_align: Clutter.ActorAlign.END,
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
