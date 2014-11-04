Router.route("changesets", {
  path: "/:searchString",

  template: "changesets",

  waitOn: function() {
    var params = this.params;

    return Meteor.subscribe("changesets", params.searchString);
  },

  data: function() {
    if (this.ready()) {
      return {
        changesets: Changesets.find()
      };
    }
  }
});
