# hg_log

Show log entries & file diffs from a Mercurial repository on a web page based on a search string given in the site url. For example, `http://localhost/log/my_repo/catz` would show all log entries in repository `my_repo` with commit message containing the string `catz`. Each log entry shown contains the commit message, files modified etc. A file diff for each file is one click away via link. File diffs are also available via url like in `http://localhost/diff/my_repo/e509aa3/catz.cs` for example.

## Run it
* [Install Meteor](https://www.meteor.com/install)
* Put Mercurial repo of your choice in `/tmp/repos/` (or whatever you configured, see below)
* In the root of the repository, run `meteor --settings settings.json`
* Enter [localhost:3000/log/repo_to_log/string_to_search](http://localhost:3000/log/repo_to_log/string_to_search). The site will update as new matching changesets are committed to the repository. If `string_to_search` is empty, the full log will be shown.

## Configuration
The configuration is provided in the settings.json file that you pass to Meteor when starting the server. The file [settings.json](https://github.com/lbergnehr/hg_log/blob/master/settings.json) contains the default settings. 

|Setting |Explanation|
|--------|-----------|
| repoStoreRootPath | Root path to the folder in which the hg repositories to monitor is located. Each repository is expected to be in a separate sub-folder of the root path. The name of each sub-folder is the  `repo_to_log`  in the web request.|
| pollInterval | A number greater than 1 that sets the interval in ms of pull/log operations per repository |
