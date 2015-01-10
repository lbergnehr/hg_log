Meteor.methods({
  getRepositoriesRootPath: function() {
    return HgLog.repoStoreRootPath;
  }
});