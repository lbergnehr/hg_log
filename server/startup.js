Meteor.startup(function() {
  var hg = Meteor.npmRequire("hg");
  var repo = new hg.HGRepo();

  Meteor.setInterval(function() {
    repo.pull("/tmp/test_repo_source", {
      "-R": "/tmp/test_repo"
    }, function(error) {
      if (error) {
        console.log(error);
        throw error;
      }
    });
  }, 2000);
});
