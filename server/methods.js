Meteor.methods({
  getRepositoriesRootPath: function() {
    return HgLog.repoStoreRootPath;
  },
  getFileDiff: function(repoName, changeSetID, fileName) {
    check(repoName, String);
    check(changeSetID, String);
    check(fileName, String);

    return HgLog.getFileDiffSync(repoName, changeSetID, fileName);
  }
});