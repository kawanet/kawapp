var assert = require("assert");
var kawapp = require("../kawapp");
var jquery = require("jquery");
var cheerio = require("cheerio");

var filename = __filename.replace(/.*\//, "") + ":";
describe(filename, tests(kawapp));

function tests(kawapp) {
  return function() {
    run("kawapp.response", kawapp.response);
    run("jquery", jquery);
    run("cheerio", cheerio);
  };

  function run(name, response) {
    describe(name, function() {
      it('html', function(done) {
        var app = kawapp();
        var res = response("<div/>");

        app.use(function(req, res, next) {
          res.html("FOO");
          next();
        });

        app.start(null, res, function(err, res) {
          assert(!err, err);
          assert(res);
          assert.equal(res.html(), "FOO");
          done();
        });
      });

      it('append', function(done) {
        var app = kawapp();
        var res = response("<div/>");

        app.use(function(req, res, next) {
          res.html("FOO");
          res.append("BAR");
          next();
        });

        app.start(null, res, function(err, res) {
          assert(!err, err);
          assert(res);
          var html = res.html();
          assert(html, "response should not be empty");
          assert(html.search("FOO") > -1, "response should include FOO");
          assert(html.search("BAR") > -1, "response should include BAR");
          done();
        });
      });

      it('empty', function(done) {
        var app = kawapp();
        var res = response("<div/>");

        app.use(function(req, res, next) {
          res.append("FOO");
          res.empty();
          res.append("BAR");
          next();
        });

        app.start(null, res, function(err, res) {
          assert(!err, err);
          assert(res);
          var html = res.html();
          assert(html, "response should not be empty");
          assert(html.search("FOO") < 0, "response should not include FOO");
          assert(html.search("BAR") > -1, "response should include BAR");
          done();
        });
      });

      if (response === cheerio) combination();
      if (response === jquery) combination();
    });

    function combination() {
      var app = kawapp();
      app.use(function(req, res, next) {
        res.append("FOO");
        res.append("BAR");
        next();
      });

      it("res.html()", function(done) {
        app.start(null, null, function(err, res) {
          assert(!err, err);
          assert(res);
          var div = response("<div/>");
          div.append(res.html());
          var html = div.html();
          assert(html, "response should not be empty");
          assert(html.search("FOO") > -1, "response should include FOO");
          assert(html.search("BAR") > -1, "response should include BAR");
          done();
        });
      });

      it("res[0]", function(done) {
        app.start(null, null, function(err, res) {
          assert(!err, err);
          assert(res);
          assert(res[0]);
          var div = response("<div/>");
          div.append(res[0]);
          var html = div.html();
          assert(html, "response should not be empty");
          assert(html.search("FOO") > -1, "response should include FOO");
          assert(html.search("BAR") > -1, "response should include BAR");
          done();
        });
      });
    }
  }
}