Template.landingPage.created = function() {
  var self = this;

  self.reposRootPath = new ReactiveVar("");

  return Meteor.call("getRepositoriesRootPath", function(error, result) {
    if (result) {
      self.reposRootPath.set(result);
    }
  });
};

Template.landingPage.helpers({
  repos: function() {
    return Repositories.find();
  },

  rootPath: function() {
    return Template.instance().reposRootPath.get();
  }
});
