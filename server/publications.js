Meteor.publish("changesets", function(repoName, searchString) {
  check(repoName, String);

  var hg = Meteor.npmRequire("hg");

  var self = this;
  this.ready();

  var repoStoreRootPath = Meteor.settings.repoStoreRootPath;

  var fullRepoPath = Npm.require("path").join(repoStoreRootPath, repoName);

  var parser = Meteor.npmRequire("xml2json");

  var handle = Meteor.setInterval(function() {
    var options = {
      "--template": "xml",
      "-v": ""
    };

    if (searchString) {
      options["-r"] = "desc(" + searchString + ")";
    }

    hg.log(fullRepoPath, options, function(error, output) {
      if (error) {
        console.log(error);
        throw error;
      }

      var xml = _(output).reduce(function(res, item) {
        return res + item.body;
      }, "");

      if (xml) {
        var obj = parser.toJson(xml, {
          object: true,
          trim: false
        });

        var entries = obj.log.logentry;
        if (!_.isArray(entries)) {
          entries = [entries];
        }

        entries.forEach(function(entry) {

          traverseObject(entry, _.partial(renameKey, "$t", "text"));
          traverseObject(entry, _.partial(deleteKey, "xml:space"));

          // uncomment for useful debug log
          //console.log(JSON.stringify(entry, undefined, 2))
          self.added("changesets", entry.node, entry);
        });
      }
    });
  }, 500);

  this.onStop(function() {
    Meteor.clearTimeout(handle);
  });

});

var deleteKey = function(key, o) {
  delete o[key];
}

var renameKey = function(oldKeyName, newKeyName, o) {
  if (o.hasOwnProperty(oldKeyName)) {
    o[newKeyName] = o[oldKeyName];
    delete o[oldKeyName];
  }
}

// Deep traverse of an object, applying function
// func to each oject. func takes one parameter, the object.
// returns the object.
var traverseObject = function(o, func) {
  if (typeof(o) == "array") {
    _(o).forEach(function(element) {
      traverseObject(element, func);
    });
  } else if (typeof(o) == "object") {
    func(o);
    _(o).keys()
      .forEach(function(key) {
        var value = o[key];
        if (value !== null && typeof(value) == "object") {
          traverseObject(o[key], func)
        }
      });
  }
  return o;
}

/*
 {
   "revision": 0,
   "node": "a3a311c43522bfaadcda246631ff40370158b9ee",
   "tag": "tip",
   "author": {
     "email": "noresjo@gmail.com",
     "text": "Noresjo"
   },
   "date": "2014-11-06T21:35:20+01:00",
   "msg": {
     "text": "commiting"
   },
   "paths": {
     "path": {
       "action": "A",
       "text": "bar.txt"
     }
   }
 }
*/