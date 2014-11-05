RepoStoreRootPath = "/tmp/repos";

Meteor.startup(function() {
  var hg = Meteor.npmRequire("hg");
  var repo = new hg.HGRepo();

  Meteor.setInterval(function() {
    getRepositories(RepoStoreRootPath).forEach(function(repositoryPath) {
      repo.pull(repositoryPath, {
        "-R": repositoryPath
      }, function(error) {
        if (error) {
          console.log(error);
          throw error;
        }
      });
    });
  }, 2000);
});

var getRepositories = function(rootPath) {
  var fs = Npm.require("fs");
  var path = Npm.require("path");

  var repos = _.chain(fs.readdirSync(rootPath))
    .filter(function(item) {
      var dirFullPath = path.join(rootPath, item);
      var isDir = fs.statSync(dirFullPath).isDirectory();

      return isDir && fs.readdirSync(dirFullPath).indexOf(".hg") !== -1;
    })
    .map(function(repoPath) {
      return path.join(rootPath, repoPath);
    })
    .value();

  return repos;
}
