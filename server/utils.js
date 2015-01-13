HgLog = {};

var Rx = Meteor.npmRequire("rx");
var hg = Meteor.npmRequire("hg");
var xml2js = Meteor.npmRequire("xml2js");

HgLog.repoStoreRootPath = Meteor.settings.repoStoreRootPath || "/tmp/repos";

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

HgLog.getFileDiffSync = function(repoName, changeSetID, fileName) {
  var result = Meteor.wrapAsync(getFileDiff)(repoName, changeSetID, fileName);
  return result;
}

var pullIntervals = Rx.Observable.timer(0, Meteor.settings.pollInterval || 1000)
  .flatMap(function() {
    return getRepositories(HgLog.repoStoreRootPath);
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
};

/*
Deep clones an object while applying function to each object
in the "deep" object tree.
The function is recursibly applied to:
- the object itself
- all property values that are objects
- all objects in property values that are arrays

func() takes one parameter, the object. 
func() should return the new object.

deepMap returns the new object. */
var deepMap = function(o, func) {
  if (typeof(o) == "array") {
    return _(o).map(function(element) {
      deepMap(element, func);
    });
  } else if (typeof(o) == "object") {
    var result = func(o);
    _(result).keys()
      .forEach(function(key) {
        result[key] = deepMap(result[key], func)
      });
    return result;
  } else {
    return _.clone(o);
  }
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

var getFileDiff = function(repoName, changeSetID, fileName, callback) {
  var hg = Meteor.npmRequire("hg");
  var Rx = Meteor.npmRequire("rx");
  var Path = Npm.require("path")

  var fullRepoPath = Path.join(HgLog.repoStoreRootPath, repoName);

  // There is no diff function in node_hg. The API is a bit dumb. We can however build
  // any command by our selves. A generalized verion of this should probably be submitted as 
  // a PR to node_hg. This is a bit of a hack but it will have to do for now.
  var repo = new hg.HGRepo();
  var rxWrappedDiffFunction = Rx.Observable.fromNodeCallback(repo._runCommandGetOutput, repo);
  var hgDiff = function(server) {
    server.runcommand.apply(server, ["diff", "-R", fullRepoPath, "-c", changeSetID, fileName]);
  }

  // request the diff from the hg command server
  var handle = rxWrappedDiffFunction(fullRepoPath, hgDiff)
    .single()
    .subscribe(function(data) {
      // We have a result. Build the final result (a string) and call the callback with it.
      var text = _(data[0])
        .filter(function(rowObject) { // we only care about entries of the o channel
          return rowObject.channel === 'o';
        })
        .map(function(rowObject) { // we want the text body
          return rowObject.body;
        })
        .reduce(function(s, row) { // put everything into one string
          return s.concat(row);
        }, "");

      var result = {};
      result.changeSetID = changeSetID;
      result.fileName = fileName;
      result.text = text;

      callback(null, result)
    });
}