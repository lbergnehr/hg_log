Meteor.publish("changesets", function(repoName, searchString) {
  check(repoName, String);
  check(searchString, Match.OneOf(String, undefined, null));

  var hg = Meteor.npmRequire("hg");

  var self = this;
  this.ready();

  var repoStoreRootPath = Meteor.settings.repoStoreRootPath;
  var fullRepoPath = Npm.require("path").join(repoStoreRootPath, repoName);

  var handle = HgLog.logResults({repo: fullRepoPath, searchString: searchString})
    .subscribe(function(entry) {
      self.added("changesets", entry.node, entry);
    });

  this.onStop(function() {
    handle.dispose();
  });
});
