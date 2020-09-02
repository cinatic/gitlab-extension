const { Gio, GObject } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

var getCustomIconPath = iconName => Gio.icon_new_for_string(Me.dir.get_child('icons').get_path() + '/' + iconName + '.svg')
