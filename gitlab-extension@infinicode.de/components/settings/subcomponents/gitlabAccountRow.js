const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gdk, Gio, GLib, GObject, Gtk, Pango } = imports.gi
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain'])
const _ = Gettext.gettext

const { SettingsHandler, SETTINGS_SCHEMA_DOMAIN } = Me.imports.helpers.settings
const { initTranslations, Translations } = Me.imports.helpers.translations

var GitlabAccountRow = GObject.registerClass({
  GTypeName: 'GitlabExtension-GitlabAccountRow',
}, class GitlabAccountRowClass extends Adw.PreferencesRow {
  constructor (item, gitlabAccountModelList) {
    super({ name: item.name })

    this.item = item
    this.gitlabAccountModelList = gitlabAccountModelList

    this._initDragAndDrop()

    this._viewRow = this._renderViewRow()
    this._editRow = this._renderEditRow()

    this._stack = new Gtk.Stack()
    this._stack.add_named(this._viewRow, 'display')
    this._stack.add_named(this._editRow, 'edit')
    this.child = this._stack
  }

  edit () {
    if (this._stack.visible_child_name === 'edit') {
      return
    }

    this._editRow.initForm(this.item)

    this._stack.visible_child_name = 'edit'
  }

  _stopEdit () {
    // this.grab_focus()
    this._stack.visible_child_name = 'display'
  }

  _initDragAndDrop () {
    const dragSource = new Gtk.DragSource()
    dragSource.set_actions(Gdk.DragAction.MOVE)

    dragSource.connect('prepare', () => {
      return Gdk.ContentProvider.new_for_value(this)
    })

    this.add_controller(dragSource)

    const dropTarget = new Gtk.DropTarget()
    dropTarget.set_gtypes([this.constructor.$gtype])
    dropTarget.set_actions(Gdk.DragAction.MOVE)

    dropTarget.connect('drop', (target, value) => {
      if (value === this) {
        return
      }

      this.gitlabAccountModelList.move(value.item.id, this.item.id)
    })
    this.add_controller(dropTarget)
  }

  _renderViewRow () {
    const viewRowBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 4,
      margin_top: 4,
      margin_bottom: 4,
      margin_start: 8,
      margin_end: 8,
    })

    const label = new Gtk.Label({
      hexpand: true,
      xalign: 0,
      max_width_chars: 25,
      ellipsize: Pango.EllipsizeMode.END,
    })
    label.label = `${this.item.name} (${this.item.onlyOwnedProjects ? Translations.SETTINGS.ONLY_OWNED_PROJECTS : Translations.SETTINGS.ALL_PROJECTS})`
    viewRowBox.append(label)

    const removeButton = new Gtk.Button({
      action_name: 'account.remove',
      icon_name: 'edit-delete-symbolic',
      has_frame: false,
    })
    viewRowBox.append(removeButton)

    this.item.bind_property_full('id',
        removeButton, 'action-target',
        GObject.BindingFlags.SYNC_CREATE,
        (bind, target) => [true, new GLib.Variant('s', target)],
        null)

    return viewRowBox
  }

  _renderEditRow () {
    const editRowBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 4,
      margin_top: 4,
      margin_bottom: 4,
      margin_start: 8,
      margin_end: 8,
    })

    editRowBox.initForm = item => {
      editRowBox._nameEntry.text = item.name || ''
      editRowBox._tokenEntry.text = item.token || ''
      editRowBox._onlyOwnedProjectsCheckButton.active = Boolean(item.onlyOwnedProjects)
      editRowBox._apiEndpointEntry.text = item.apiEndpoint || ''
    }

    editRowBox._nameEntry = new Gtk.Entry({
      max_width_chars: 25,
      placeholder_text: Translations.SETTINGS.ACCOUNT_NAME
    })

    editRowBox._apiEndpointEntry = new Gtk.Entry({
      max_width_chars: 25,
      placeholder_text: Translations.SETTINGS.API_ENDPOINT
    })

    editRowBox._tokenEntry = new Gtk.Entry({
      max_width_chars: 25,
      placeholder_text: Translations.SETTINGS.TOKEN
    })

    editRowBox._onlyOwnedProjectsCheckButton = new Gtk.CheckButton({
      label: Translations.SETTINGS.ONLY_OWNED_PROJECTS
    })

    const saveButton = new Gtk.Button({
      icon_name: 'object-select-symbolic',
      has_frame: false,
    })

    saveButton.connect('clicked', () => {
      const data = [
        this.item.id,
        editRowBox._nameEntry.text,
        editRowBox._apiEndpointEntry.text,
        editRowBox._onlyOwnedProjectsCheckButton.active,
        editRowBox._tokenEntry.text
      ]

      this.activate_action('account.edit', new GLib.Variant('(sssbs)', data))
      this._stopEdit()
    })

    editRowBox.append(editRowBox._nameEntry)
    editRowBox.append(editRowBox._apiEndpointEntry)
    editRowBox.append(editRowBox._tokenEntry)
    editRowBox.append(editRowBox._onlyOwnedProjectsCheckButton)
    editRowBox.append(saveButton)

    const controller = new Gtk.ShortcutController()
    controller.add_shortcut(new Gtk.Shortcut({
      trigger: Gtk.ShortcutTrigger.parse_string('Escape'),
      action: Gtk.CallbackAction.new(() => {
        this._stopEdit()
        return true
      }),
    }))
    editRowBox._nameEntry.add_controller(controller)

    return editRowBox
  }
})
