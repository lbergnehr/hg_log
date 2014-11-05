Meteor.publish("changesets", function(repoName, searchString) {
  check(repoName, String);
  check(searchString, String);

  var hg = Meteor.npmRequire("hg");

  var self = this;
  this.ready();

  var repoStoreRootPath = Meteor.settings.repoStoreRootPath;

  var fullRepoPath = Npm.require("path").join(repoStoreRootPath, repoName);

  var parser = Meteor.npmRequire("xml2json");

  var handle = Meteor.setInterval(function() {
    hg.log(fullRepoPath, {
      "-r": "desc(" + searchString + ")",
      "--template": "xml"
    }, function(error, output) {
      if (error) {
        console.log(error);
        throw error;
      }

      var xml = _(output).reduce(function(res, item) {
        return res + item.body;
      }, "");

      if (xml) {
        var obj = parser.toJson(xml, {
          object: true
        });

        var entries = obj.log.logentry;
        if (!_.isArray(entries)) {
          entries = [entries];
        }

        entries.forEach(function(entry) {
          var id = entry.node.substring(0, 24);
          self.added("changesets", new Mongo.ObjectID(id), entry);
        });
      }
    });
  }, 500);

  this.onStop(function() {
    Meteor.clearTimeout(handle);
  });
});
