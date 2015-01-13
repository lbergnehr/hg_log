HgLog = {};

var Rx = Meteor.npmRequire("rx");
var hg = Meteor.npmRequire("hg");
var xml2js = Meteor.npmRequire("xml2js");

var parser = new xml2js.Parser({
  mergeAttrs: true,
  explicitArray: false,
  charkey: "text",
  strict: false,
  normalizeTags: true,
  attrNameProcessors: [

    function(attr) {
      return attr.toLowerCase();
    }
  ]
});

var repoStoreRootPath = Meteor.settings.repoStoreRootPath || "/tmp/repos";

HgLog.pullResults = function() {
  return pullResults;
};

HgLog.logResults = function(options) {
  return pullResults
    .filter(function(result) {
      return result.repo === options.repo;
    })
    .flatMap(function(result) {
      return getLogs(result.repo, options.searchString);
    });
};

HgLog.repositories = function() {
  return pullIntervals;
};

var pullIntervals = Rx.Observable.timer(0, Meteor.settings.pollInterval || 1000)
  .flatMap(function() {
    return getRepositories(repoStoreRootPath);
  })
  .share();
var pullResults = pullIntervals
  .flatMap(Rx.helpers.identity)
  .flatMap(function(repoPath) {
    return pullRepository(repoPath);
  })
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
    .flatMap(function(xml) {
      parser.reset();
      return Rx.Observable.fromNodeCallback(parser.parseString)(xml);
    })
    .pluck("log").pluck("logentry")
    .flatMap(function(entries) {
      return _.isArray(entries) ? entries : [entries];
    })
    .do(function(entry) {
      entry.revision = parseInt(entry.revision, 10);
    });
};

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
        .filter(function(x) {
          return x.isDirectory();
        })
        .flatMap(function() {
          return Rx.Observable.fromNodeCallback(fs.readdir)(dirFullPath);
        })
        .filter(function(dirs) {
          return dirs.indexOf(".hg") !== -1;
        })
        .map(function() {
          return dirFullPath
        });
    })
    .reduce(function(paths, path) {
      paths.push(path);
      return paths;
    }, []);
};

// Pull from a specified repository.
// Returns: An Observable which produces `hg pull` output.
var pullRepository = function(repositoryPath) {
  var repo = new hg.HGRepo();
  return Rx.Observable.fromNodeCallback(repo.pull, repo)(repositoryPath, {
      "-R": repositoryPath
    })
    .map(function(output) {
      return {
        repo: repositoryPath,
        output: output
      };
    });
};