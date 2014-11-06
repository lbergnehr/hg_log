# hg_log

Show log entries from a Mercurial repository on a web page based on a search string given in the site url, i.e. `http://localhost/my_repo/catz` would show all log entries in repository `my_repo` with commit message containing the string `catz`.

## Run it
* [Install Meteor](https://www.meteor.com/install)
* Put Mercurial repo of your choice in `/tmp/repos/` (or whatever you configured)
* In the root of the repository, run `meteor --settings settings.json`
* Enter [localhost:3000/repo_to_log/string_to_search](http://localhost:3000/repo_to_log/string_to_search). The site will update as new matching changesets are committed to the repository.

## Configuration
The configuraion is provided in the settings.json file that you pass to Meteor when starting the server. [settings.json](https://github.com/lbergnehr/hg_log/blob/master/settings.json) for more details.
