Template.changesets.helpers({
  changesets: function() {
    return this.changesets;
  }
});

Template.changeset.helpers({
  filePaths: function() {
    var paths = (this.paths && this.paths.path) || [];
    if (!_.isArray(paths)) {
      paths = [paths];
    }

    return paths;
  }
});
