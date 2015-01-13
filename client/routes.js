Router.route("/", {
  name: "home",
  template: "landingPage",

  waitOn: function() {
    return Meteor.subscribe("repositories");
  }
});

Router.route("/log/:repoName/:searchString(.*)?", {
  name: "changesets",
  template: "changesets",

  waitOn: function() {
    var params = this.params;

    return Meteor.subscribe("changesets", params.repoName, params.searchString);
  },

  data: function() {
    if (this.ready()) {
      var reponame = this.params.repoName;
      return {
        changesets: Changesets.find({}, {
          sort: [
            ["revision", "desc"]
          ]
        }),
        repoName: reponame
      };
    }
  }
});

Router.route("/diff/:repoName/:changeSetID/:fileName(.*)", {
  name: "diff"
});