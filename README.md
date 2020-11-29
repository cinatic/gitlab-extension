# [gitlab-extension](https://extensions.gnome.org/extension/3535/gitlab-extension/)
[![Actions Status: Build & Create Package](https://github.com/cinatic/gitlab-extension/workflows/Build%20%26%20Create%20Package/badge.svg)](https://github.com/cinatic/gitlab-extension/actions?query=workflow%3A"Build+&+Create+Package")
[![Actions Status: Build Package & Create Release](https://github.com/cinatic/gitlab-extension/workflows/Build%20Package%20%26%20Create%20Release/badge.svg)](https://github.com/cinatic/gitlab-extension/actions?query=workflow%3A"Build+Package+&+Create+Release")

GitLab extension utilizes the official GitLab API to provide a comfortable overview about your projects, 
commits & pipelines.

<p align="middle">
<img alt="projects" src="https://github.com/cinatic/gitlab-extension/raw/master/images/projects.png" width="350">
<img alt="commits" src="https://github.com/cinatic/gitlab-extension/raw/master/images/commits.png" width="350">
</p>

### Setup
Either install it: 
- via EGS https://extensions.gnome.org/extension/3535/gitlab-extension/
- Or download latest release: https://github.com/cinatic/gitlab-extension/releases/latest

## Data Source
The data is fetched from the official GitLab API https://docs.gitlab.com/ee/api/. 
The API has some *limitions*, e.g. it only returns domain specific data. 
As an example `projects` and `commits` for example do not have any information of the pipeline status or you
can only fetch `pipelines` for a single project. So in this extension we mash up some data and can show only 
the pipeline information for the most recent projects to avoid hitting the 10 requests / s limit.

If you want to play with the API you might be interested in this postman collection --> https://github.com/cinatic/gitlab-postman-collection

## TODO

- lazy loading of additional data (like project pipeline status)
- detail view for commits
- detail view for pipeline w/ nice jobs visualization
- add pagination
- add setting to toggle public / private repositories

## Shoutouts

GNOME just rocks, thanks to all contributors!

Helpful things for building a extension:

https://gjs.guide/

https://gjs-docs.gnome.org/

https://wiki.gnome.org/Projects/GnomeShell/Development

https://gitlab.gnome.org/GNOME/gjs/blob/master/doc/Modules.md

Nice Soup wrapper / fetch shim:
https://github.com/satya164/gjs-helpers/blob/master/src/fetch.js

Danks also for the support [andyholmes](https://github.com/andyholmes) & [konkor](https://github.com/konkor)
