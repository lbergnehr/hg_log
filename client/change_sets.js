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
    var result = "";
    var firstLineBreakPos = this.msg.text.indexOf('\n');

    // Check if there is a line break and it is not at the end of the message
    if ((firstLineBreakPos != -1) && ((firstLineBreakPos + 1) < this.msg.text.length)) {
      //multiline comment
      result = this.msg.text.substr(firstLineBreakPos + 1).trim();
    }
    return result;
  }
});