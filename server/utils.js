HgLog = {};

var Rx = Meteor.npmRequire("Rx");
var repoStoreRootPath = Meteor.settings.repoStoreRootPath || "/tmp/repos";

HgLog.pulls = function(repoStoreRootPath) {
  return logObservable;
};
var logObservable = Rx.Observable.interval(2000)
  .flatMap(function() { return getRepositories(repoStoreRootPath); })
  .flatMap(function(repoPath) { return pullRepository(repoPath); })
  .share();

// Get hg repositories from a specified root directory.
// Returns: An Observable which produces full paths to mercurial directories.
var getRepositories = function(rootPath) {
  var path = Npm.require("path");
  var fs = Npm.require("fs");

  return Rx.Observable.fromNodeCallback(fs.readdir)(rootPath)
    .flatMap(function(items) { return items; })
    .flatMap(function(item) {
      var dirFullPath = path.join(rootPath, item);
      return Rx.Observable.fromNodeCallback(fs.stat)(dirFullPath)
        .filter(function(x) { return x.isDirectory(); })
        .flatMap(function() { return Rx.Observable.fromNodeCallback(fs.readdir)(dirFullPath); })
        .filter(function(dirs) {
          return dirs.indexOf(".hg") !== -1;
        })
        .map(function() { return dirFullPath });
    });
};

// Pull from a specified repository.
// Returns: An Observable which produces `hg pull` output.
var pullRepository = function(repositoryPath) {
  var hg = Meteor.npmRequire("hg");
  var repo = new hg.HGRepo();
  return Rx.Observable.fromNodeCallback(repo.pull, repo)(repositoryPath, {
    "-R": repositoryPath
  });
};
