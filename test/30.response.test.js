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
        var canvas = response("<div/>");

        app.use(function(context, canvas, next) {
          canvas.html("FOO");
          next();
        });

        app.start(null, canvas, function(err, canvas) {
          assert(!err, err);
          assert(canvas);
          assert.equal(canvas.html(), "FOO");
          done();
        });
      });

      it('append', function(done) {
        var app = kawapp();
        var canvas = response("<div/>");

        app.use(function(context, canvas, next) {
          canvas.html("FOO");
          canvas.append("BAR");
          next();
        });

        app.start(null, canvas, function(err, canvas) {
          assert(!err, err);
          assert(canvas);
          var html = canvas.html();
          assert(html, "response should not be empty");
          assert(html.search("FOO") > -1, "response should include FOO");
          assert(html.search("BAR") > -1, "response should include BAR");
          done();
        });
      });

      it('empty', function(done) {
        var app = kawapp();
        var canvas = response("<div/>");

        app.use(function(context, canvas, next) {
          canvas.append("FOO");
          canvas.empty();
          canvas.append("BAR");
          next();
        });

        app.start(null, canvas, function(err, canvas) {
          assert(!err, err);
          assert(canvas);
          var html = canvas.html();
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
      app.use(function(context, canvas, next) {
        canvas.append("FOO");
        canvas.append("BAR");
        next();
      });

      it("canvas.html()", function(done) {
        app.start(null, null, function(err, canvas) {
          assert(!err, err);
          assert(canvas);
          var div = response("<div/>");
          div.append(canvas.html());
          var html = div.html();
          assert(html, "response should not be empty");
          assert(html.search("FOO") > -1, "response should include FOO");
          assert(html.search("BAR") > -1, "response should include BAR");
          done();
        });
      });

      it("canvas[0]", function(done) {
        app.start(null, null, function(err, canvas) {
          assert(!err, err);
          assert(canvas);
          assert(canvas[0]);
          var div = response("<div/>");
          div.append(canvas[0]);
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