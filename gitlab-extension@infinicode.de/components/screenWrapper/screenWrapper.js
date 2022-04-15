const { GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { ProjectsScreen } = Me.imports.components.screens.projectsScreen.projectsScreen
const { ProjectDetailsScreen } = Me.imports.components.screens.projectDetailsScreen.projectDetailsScreen
const { EventHandler } = Me.imports.helpers.eventHandler

var ScreenWrapper = GObject.registerClass(
    class ScreenWrapper extends St.Widget {
      _init () {
        super._init({
          style_class: 'screen-wrapper'
        })

        this._showScreenConnectId = EventHandler.connect('show-screen', (sender, { screen, additionalData }) => this.showScreen(screen, additionalData))

        this.showScreen()
      }

      showScreen (screenName, additionalData) {
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
        this.add_child(screen)
      }

      _onDestroy () {
        if (this._showScreenConnectId) {
          EventHandler.disconnect(this._showScreenConnectId)
        }
      }
    }
)
