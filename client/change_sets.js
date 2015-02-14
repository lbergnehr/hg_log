Template.changesets.helpers({
  changesets: function() {
    return this.changesets;
  },
  anyMatchingChangeSet: function() {
    return this.changesets.count() > 0;
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
  niceTime: function() {
    var date = new Date(this.date[0] * 1000);
    return date.toLocaleTimeString() + " " + date.toLocaleDateString();
  },
  changesetsummary: function() {
    return this.desc.split('\n')[0];
  },
  changesettext: function() {
    var result = "";
    var firstLineBreakPos = this.desc.indexOf('\n');

    // Check if there is a line break and it is not at the end of the message
    if ((firstLineBreakPos != -1) && ((firstLineBreakPos + 1) < this.desc.length)) {
      //multiline comment
      result = this.desc.substr(firstLineBreakPos + 1).trim();
    }
    return result;
  },
  shortFormId: function() {
    return this.node.slice(0, 12);
  },
  getDiffLinkData: function() {
    return {
      repoName: Router.current().data().repoName,
      fileName: this,
      changeSetID: Template.instance().data.revision
    }
  }
});