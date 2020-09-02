const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { ProjectsScreen } = Me.imports.components.screens.projectsScreen.projectsScreen
const { ProjectDetailsScreen } = Me.imports.components.screens.projectDetailsScreen.projectDetailsScreen
const { EventHandler } = Me.imports.helpers.eventHandler

var ScreenWrapper = GObject.registerClass(
    class ScreenWrapper extends St.Widget {
      _init () {
        super._init({
          style_class: 'screen-wrapper',
          layout_manager: new Clutter.BinLayout(),
          x_expand: true,
          y_expand: true
        })

        EventHandler.connect('show-screen', (sender, { screen, additionalData }) => this.showScreen(screen, additionalData))

        this.showScreen()
      }

      showScreen (screenName, additionalData) {
        screenName = screenName || 'projects'

        let screen

        switch (screenName) {
          case 'project-details':
            screen = new ProjectDetailsScreen(additionalData.item)
            break

          case 'projects':
          default:
            screen = new ProjectsScreen()
            break
        }

        this.destroy_all_children()
        this.add_actor(screen)
      }
    }
)
