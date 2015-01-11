Template.diff.created = function() {
  var self = this;
  var params = Router.current().params;

  self.diffLines = new ReactiveVar("");
  return Meteor.call("getFileDiff", params.repoName, params.changeSetID, params.fileName,
    function(error, result) {
      if (result) {
        self.diffLines.set(result.text.split('\n'));
      };
    });
};

Template.diff.helpers({
  rowAttributes: function() {
    var result = "";
    if (this && (this.length > 0)) {
      switch (this[0]) {
        case '+':
          result = "added"
          break;
        case '-':
          result = "removed"
          break;
        default:
          result = ""
          break;
      }
    }
    return result ? {
      class: result
    } : {};
  },
  isLocator: function() {
    return this && (this.length > 1) && this.slice(0, 2) === "@@";
  },
  lines: function() {
    return Template.instance().diffLines.get();
  }
});