Router.route("changesets", {
  path: "/:repoName/:searchString",

  template: "changesets",

  waitOn: function() {
    var params = this.params;

    return Meteor.subscribe("changesets", params.repoName, params.searchString);
  },

  data: function() {
    if (this.ready()) {
      return {
        changesets: Changesets.find()
      };
    }
  }
});
