import GObject from 'gi://GObject'

import { DEFAULT_GITLAB_DATA } from '../../../helpers/settings.js'

export const GitlabAccountItem = GObject.registerClass({
  GTypeName: 'GitlabExtension-GitlabAccountItem',
  Properties: {
    'id': GObject.ParamSpec.string('id', 'id', 'id', GObject.ParamFlags.READWRITE, null),
    'name': GObject.ParamSpec.string('name', 'name', 'name', GObject.ParamFlags.READWRITE, DEFAULT_GITLAB_DATA.name),
    'apiEndpoint': GObject.ParamSpec.string('apiEndpoint', 'apiEndpoint', 'apiEndpoint', GObject.ParamFlags.READWRITE, DEFAULT_GITLAB_DATA.apiEndpoint),
    'token': GObject.ParamSpec.string('token', 'token', 'token', GObject.ParamFlags.READWRITE, null),
    'onlyOwnedProjects': GObject.ParamSpec.boolean('onlyOwnedProjects', 'onlyOwnedProjects', 'onlyOwnedProjects', GObject.ParamFlags.READWRITE, DEFAULT_GITLAB_DATA.onlyOwnedProjects),
  },
}, class GitlabAccountItemClass extends GObject.Object {
  id = null
  name = null
  apiEndpoint = null
  token = null
  onlyOwnedProjects = true
})
