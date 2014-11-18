Meteor.startup(function() {

  console.log(JSON.stringify(Meteor.settings));

  HgLog.pulls()
    .map(function(x) {
      return x[0][0].body.trim();
    }).subscribe(console.log, console.log);
});
