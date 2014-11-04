Meteor.publish("changesets", function(searchString) {
  this.added("changesets", "someId", {
    name: searchString
  });
  this.ready();
});
