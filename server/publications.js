Meteor.publish("changesets", function(repoName, searchString) {
  check(repoName, String);
  check(searchString, Match.OneOf(String, undefined, null));

  var hg = Meteor.npmRequire("hg");

  var self = this;
  this.ready();

  var repoStoreRootPath = Meteor.settings.repoStoreRootPath || "/tmp/repos/";
  var fullRepoPath = Npm.require("path").join(repoStoreRootPath, repoName);

  var handle = HgLog.logResults({repo: fullRepoPath, searchString: searchString})
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
  var handle = HgLog.repositories()
    .distinctUntilChanged(function(x) { return x; }, _.isEqual)
    .startWith([])
    .bufferWithCount(2, 1)
    .subscribe(function(repos) {
      var lastSet = repos[0];
      var newSet = repos[1];

      // Added repos
      _.chain(newSet)
        .difference(lastSet)
        .each(function(repoPath) {
          self.added("repositories", repoPath, {
            path: repoPath,
            name: path.basename(repoPath)
          });
        });

      // Removed repos
      _.chain(lastSet)
        .difference(newSet)
        .each(function(repoPath) {
          self.removed("repositories", repoPath);
        });
    });

  this.onStop(function() {
    handle.dispose();
  });
});
