var escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

Template.landingPage.created = function() {
  var self = this;

  self.reposRootPath = new ReactiveVar("");
  self.searchText = new ReactiveVar("");
  self.repoText = new ReactiveVar(Session.get("lastRepoName"));
  self.actualRepo = new ReactiveVar("");

  self.hideOverlay = function() {
    self.$("#searchInput")
      .val("")
      .blur();
    self.$(".overlay").hide();
    self.$(".landingPage").show();
    self.$(".landingPage").find("a").removeAttr("tabindex");
    self.$(".overlay").find("input").attr("tabindex", "-1");
  }

  self.showOverlay = function() {
    self.$(".landingPage").hide();
    self.$(".overlay").show();
    self.$("#searchInput").focus();
    self.$(".landingPage").find("a").attr("tabindex", "-1");
    self.$(".overlay").find("input").removeAttr("tabindex");
  }

  self.autorun(function() {

    var repoSearchString = self.repoText.get();
    var result = "";
    if (repoSearchString) {
      var repoToSearchIn = Repositories.findOne({
        repoName: {
          $regex: escapeRegExp(self.repoText.get())
        }
      });

      result = repoToSearchIn ? repoToSearchIn.repoName : "";
    }
    self.actualRepo.set(result);
  });

  return Meteor.call("getRepositoriesRootPath", function(error, result) {
    if (result) {
      self.reposRootPath.set(result);
    }
  });
};

Template.landingPage.helpers({
  reactiveVar: function(name) {
    return Template.instance()[name].get();
  },
  repos: function() {
    return Repositories.find();
  },
  searchResults: function() {
    return Repositories.find({
      repoName: {
        $regex: escapeRegExp(Template.instance().repoText.get())
      }
    });
  }
});

Template.landingPage.events({
  'click .close-search': function() {
    Template.instance().hideOverlay();
  },
  'blur #repoInput': function(event) {
    var instance = Template.instance();
    var repo = instance.actualRepo.get();
    instance.repoText.set(repo);
    $(event.currentTarget).val(repo);
  },
  'keyup #searchInput': function(event) {
    var instance = Template.instance();
    instance.searchText.set(event.target.value);
  },
  'keyup #repoInput': function(event) {
    var instance = Template.instance();
    instance.repoText.set(event.target.value);
  },

  'keydown': function(event) {
    var instance = Template.instance();
    var keyESC = event.keyCode === 27;
    var keyENTER = event.keyCode === 13;

    if (keyESC) {
      instance.hideOverlay();
    }

    if (keyENTER && instance.actualRepo.get()) {
      var repoName = instance.actualRepo.get();
      var searchString = instance.searchText.get();
      Session.set("lastRepoName", repoName);

      Router.go('changesets', {
        repoName: repoName,
        searchString: searchString
      });
    }
  }

});

Template.landingPage.rendered = function() {
  var instance = this;
  // initial state
  instance.hideOverlay();
  instance.$("#repoInput").val(instance.repoText.get());
  instance.onBodyKeyPress = function(event) {
    if (!$searchInput.val()) {
      instance.showOverlay()
    }
  }

  var $searchInput = instance.$("#searchInput");
  //Basically, for now, you can attach an event handler to the body element directly. 
  //Wait until the template is  rendered, and then used jQuery to attach the handler:
  $("body").keypress(instance.onBodyKeyPress);
}

Template.landingPage.destroyed = function() {
  var instance = this;
  $("body").off("keypress", null, instance.onBodyKeyPress);
};