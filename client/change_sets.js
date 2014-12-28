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
  },
  changesetsummary: function() {
    return this.msg.text.split('\n')[0];
  },
  changesettext: function() {
    return this.msg.text.split('\n').slice(1);
  }
});