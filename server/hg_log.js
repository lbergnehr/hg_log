/* hg_log API */

HgLog = {};

/* Information about repositories */
HgLog.repositories = function() {
  return repositoryPaths;
};

HgLog.addedRepositories = function() {
  return bufferedRepositories().flatMap(function(repos) {
    var lastSet = repos[0];
    var newSet = repos[1];

    return _(newSet).difference(lastSet);
  });
};

HgLog.removedRepositories = function() {
  return bufferedRepositories().flatMap(function(repos) {
    var lastSet = repos[0];
    var newSet = repos[1];

    return _(lastSet).difference(newSet);
  });
};

/* Log results for a specific repository */
HgLog.logResults = function(options) {
  return pullResults
    .filter(function(result) {
      return result.repo === options.repo;
    })
    .flatMap(function(result) {
      var sequence = getLogs(result.repo, options.searchString);
      if (options.maxResults) {
        sequence = sequence.take(options.maxResults);
      }

      return sequence;
    });
};

/* Diff for specific repo, changeset and file */
HgLog.getFileDiffSync = function(repoName, changeSetID, fileName) {
  var result = Meteor.wrapAsync(getFileDiff)(repoName, changeSetID, fileName);
  return result;
};

/* Internal functions */

var Rx = Meteor.npmRequire("rx");
var hg = Meteor.npmRequire("hg");

HgLog.repoStoreRootPath = Meteor.settings.repoStoreRootPath || "/tmp/repos";

var bufferedRepositories = function() {
  return repositoryPaths.distinctUntilChanged(function(x) {
      return x;
    }, _.isEqual)
    .startWith([])
    .pairwise();
};

var repositoryPaths = Rx.Observable.timer(0, Meteor.settings.pollInterval || 1000)
  .flatMap(function() {
    return getRepositories(HgLog.repoStoreRootPath);
  })
  .share();

// There is no tip function in node_hg. The API is a bit dumb. We can
// however build any command by our selves. This is a bit of a hack
// but it will have to do for now.
var runHgCommand = function(repoPath) {
  var repo = new hg.HGRepo();
  var rxWrapped_runCommandGetOutput = Rx.Observable
    .fromNodeCallback(repo._runCommandGetOutput, repo);

  var hgArgs = Array.prototype.slice.call(arguments, 1);
  var func = function(server) {
    server.runcommand.apply(server, hgArgs);
  };

  return rxWrapped_runCommandGetOutput(repoPath, func)
}

var getRepositoryTip = function(repoPath) {

  return runHgCommand(repoPath, "tip")
    .map(function(output) {
      return output[0][0].body;
    });
};

var pullResults = repositoryPaths
  .flatMap(Rx.helpers.identity)
  .flatMap(function(repoPath) {
    return getRepositoryTip(repoPath)
      .map(function(tip) {
        return {
          repoPath: repoPath,
          tip: tip
        }
      });
  })
  .distinctUntilChanged(function(x) {
    return x.tip;
  })
  .pluck("repoPath")
  .flatMap(function(repoPath) {
    return pullRepository(repoPath);
  })
  .share()
  .replay(Rx.helpers.identity, 1);

// Get hg log for a hg repository
// Returns: An Observable which produces log messages from hg.
var getLogs = function(repoPath, searchString) {
  var options = {
    "--template": "json",
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
    .flatMap(function(json) {
      var entries = JSON.parse(json);
      return Rx.Observable.fromArray(_.isArray(entries) ? entries : [entries]);
    })
    .do(function(entry) {
      entry.revision = parseInt(entry.rev, 10);
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

var getFileDiff = function(repoName, changeSetID, fileName, callback) {
  var Path = Npm.require("path")

  var fullRepoPath = Path.join(HgLog.repoStoreRootPath, repoName);

  // request the diff from the hg command server
  var handle = runHgCommand(fullRepoPath, "diff", "-c", changeSetID, fileName)
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
