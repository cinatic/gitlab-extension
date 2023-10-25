import GObject from 'gi://GObject'
import St from 'gi://St'

import { ProjectDetailsScreen } from '../screens/projectDetailsScreen/projectDetailsScreen.js'
import { ProjectsScreen } from '../screens/projectsScreen/projectsScreen.js'

export const ScreenWrapper = GObject.registerClass(
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
