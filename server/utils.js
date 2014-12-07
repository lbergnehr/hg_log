HgLog = {};

var Rx = Meteor.npmRequire("Rx");
var hg = Meteor.npmRequire("hg");
var parser = Meteor.npmRequire("xml2json");

var repoStoreRootPath = Meteor.settings.repoStoreRootPath || "/tmp/repos";

HgLog.pullResults = function() {
  return pullResults;
};

HgLog.logResults = function(options) {
  return pullResults
    .filter(function(result) { return result.repo === options.repo; })
    .flatMap(function(result) {
      return getLogs(result.repo, options.searchString);
    });
};

var pullIntervals = Rx.Observable.interval(5000)
  .flatMap(function() { return getRepositories(repoStoreRootPath); });
var pullResults = pullIntervals
  .flatMap(function(repoPath) { return pullRepository(repoPath); })
  .share()
  .replay(Rx.helpers.identity, 1);

// Get hg log for a hg repository
// Returns: An Observable which produces log messages from hg.
var getLogs = function(repoPath, searchString) {
  var options = {
    "--template": "xml",
    "-v": ""
  };

  if (searchString) {
    options["-r"] = "desc(" + searchString + ")";
  }

  return Rx.Observable.fromNodeCallback(hg.log, hg)(repoPath, options)
    .map(function(output) {
      return _(output[0]).reduce(function(res, item) {
        return res + item.body;
      }, "");
    })
    .filter(Rx.helpers.identity)
    .map(function(xml) { return parser.toJson(xml, { object: true, trim: false }); })
    .pluck("log").pluck("logentry")
    .flatMap(function(entries) {
      return _.isArray(entries) ? entries : [entries];
    })
    .do(function(entry) {
      traverseObject(entry, _.partial(renameKey, "$t", "text"));
      traverseObject(entry, _.partial(deleteKey, "xml:space"));
    });
};

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

// Get hg repositories from a specified root directory.
// Returns: An Observable which produces full paths to mercurial
// directories.
var getRepositories = function(rootPath) {
  var path = Npm.require("path");
  var fs = Npm.require("fs");

  return Rx.Observable.fromNodeCallback(fs.readdir)(rootPath)
    .flatMap(Rx.helpers.identity)
    .flatMap(function(item) {
      var dirFullPath = path.join(rootPath, item);
      return Rx.Observable.fromNodeCallback(fs.stat)(dirFullPath)
        .filter(function(x) { return x.isDirectory(); })
        .flatMap(function() { return Rx.Observable.fromNodeCallback(fs.readdir)(dirFullPath); })
        .filter(function(dirs) {
          return dirs.indexOf(".hg") !== -1;
        })
        .map(function() { return dirFullPath });
    });
};

// Pull from a specified repository.
// Returns: An Observable which produces `hg pull` output.
var pullRepository = function(repositoryPath) {
  var repo = new hg.HGRepo();
  return Rx.Observable.fromNodeCallback(repo.pull, repo)(repositoryPath, {
    "-R": repositoryPath
  })
  .map(function(output) { return { repo: repositoryPath, output: output }; });
};
