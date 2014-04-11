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
      app.use(function(context, canvas, next) {
        context.foo = "FOO";
        next();
      });
      app.use(kawapp.mw.location());
      app.use(kawapp.mw.parseQuery());
      app.use(kawapp.mw.parseHash());
      app.use(function(context, canvas, next) {
        context.bar = "BAR";
        next();
      });
      var context = {};
      app.start(context, null, function(err) {
        assert.equal(context.foo, "FOO");
        assert.equal(context.bar, "BAR");
        done();
      });
    });
  };
}
