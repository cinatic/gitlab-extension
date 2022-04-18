const { GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { ProjectsScreen } = Me.imports.components.screens.projectsScreen.projectsScreen
const { ProjectDetailsScreen } = Me.imports.components.screens.projectDetailsScreen.projectDetailsScreen

var ScreenWrapper = GObject.registerClass(
    class ScreenWrapper extends St.Widget {
      _init (mainEventHandler) {
        super._init({
          style_class: 'screen-wrapper'
        })

        this._mainEventHandler = mainEventHandler
        this._showScreenConnectId = this._mainEventHandler.connect('show-screen', (sender, { screen, additionalData }) => this.showScreen(screen, additionalData))

        this.showScreen()
      }

      showScreen (screenName, additionalData) {
        let screen

        switch (screenName) {
          case 'project-details':
            screen = new ProjectDetailsScreen(additionalData.item, this._mainEventHandler)
            break

          case 'projects':
          default:
            screen = new ProjectsScreen(this._mainEventHandler)
            break
        }

        this.destroy_all_children()
        this.add_child(screen)
      }

      _onDestroy () {
        if (this._showScreenConnectId) {
          this._mainEventHandler.disconnect(this._showScreenConnectId)
        }
      }
    }
)
