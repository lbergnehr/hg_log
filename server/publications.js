Meteor.publish("changesets", function(searchString) {
  var hg = Meteor.npmRequire("hg");

  var self = this;
  this.ready();
  var destPath = "/tmp/test_repo";

  var handle = Meteor.setInterval(function() {
    hg.log(destPath, {
      "-r": "desc(" + searchString + ")",
      "--template": "{node|short};{desc}\n"
    }, function(error, output) {
      if (error) {
        console.log(error);
        throw error;
      }

      if (output) {
        output.forEach(function(line) {
          var goodLine = line.body.trim();
          if (!goodLine) {
            return;
          }

          var ar = goodLine.split(";");
          var id = ar[0];
          var desc = ar[1];

          self.added("changesets", new Mongo.ObjectID(id + id), {
            id: id,
            desc: desc
          });
        });
      }
    });
  }, 500);

  this.onStop(function() {
    Meteor.clearTimeout(handle);
    console.log("Cleared timeout");
  });
});
