var assert = require("assert");
var kawapp = require("../kawapp");
var kawappmin = require("../dist/kawapp.min");

var filename = __filename.replace(/.*\//, "") + ":";
describe(filename, run);

function run() {
  describe("kawapp.js", tests(kawapp));
  describe("kawapp.min.js", tests(kawappmin));
}

function tests(kawapp) {
  return function() {
    it('start', function(done) {
      var app = kawapp();
      app.start(null, null, done);
    });

    it('use', function(done) {
      var app = kawapp();
      app.use(function(req, res, next) {
        req.foo = "FOO";
        next();
      });
      app.use(kawapp.location());
      app.use(kawapp.parseQuery());
      app.use(kawapp.parseHash());
      app.use(function(req, res, next) {
        req.bar = "BAR";
        next();
      });
      var req = {};
      app.start(req, null, function(err) {
        assert.equal(req.foo, "FOO");
        assert.equal(req.bar, "BAR");
        done();
      });
    });
  };
}
