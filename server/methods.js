Meteor.methods({
  getRepositoriesRootPath: function() {
    return Meteor.settings.repoStoreRootPath || "/tmp/repos";
  }
});
