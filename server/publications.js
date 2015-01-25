Meteor.publish("changesets", function(repoName, searchString) {
  check(repoName, String);
  check(searchString, Match.OneOf(String, undefined, null));

  var hg = Meteor.npmRequire("hg");

  var self = this;
  this.ready();

  var fullRepoPath = Npm.require("path").join(HgLog.repoStoreRootPath, repoName);

  var handle = HgLog.logResults({
      repo: fullRepoPath,
      searchString: searchString
    })
    .retry()
    .subscribe(function(entry) {
      self.added("changesets", entry.node, entry);
    });

  this.onStop(function() {
    handle.dispose();
  });
});

Meteor.publish("repositories", function() {
  var self = this;
  self.ready();

  var path = Meteor.npmRequire("path");

  var addedHandle = HgLog.addedRepositories()
    .subscribe(function(repoPath) {
      self.added("repositories", repoPath, {
        path: repoPath,
        repoName: path.basename(repoPath)
      });
    });

  var removedHandle = HgLog.removedRepositories()
    .subscribe(function(repoPath) {
      self.removed("repositories", repoPath);
    });

  this.onStop(function() {
    addedHandle.dispose();
    removedHandle.dispose();
  });
});
