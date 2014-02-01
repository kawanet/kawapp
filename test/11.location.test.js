var assert = require("assert");
var kawapp = require("../kawapp");

var filename = __filename.replace(/.*\//, "") + ":";
describe(filename, tests(kawapp));

function tests(kawapp) {
  return function() {
    var loc = {
      search: "?foo=FOO",
      hash: "#!?bar=BAR"
    };

    it('parseQuery', function(done) {
      var app = kawapp();
      var req = { location: loc };
      app.use(kawapp.parseQuery());
      app.use(function(req, res, next) {
        assert.equal(req.foo, "FOO");
        assert.notEqual(req.bar, "BAR");
        next();
        done();
      });
      app.use(kawapp.parseQuery());
      app.start(req);
    });

    it('parseHash', function(done) {
      var app = kawapp();
      var req = { location: loc };
      app.use(kawapp.parseHash());
      app.use(function(req, res, next) {
        assert.notEqual(req.foo, "FOO");
        assert.equal(req.bar, "BAR");
        next();
        done();
      });
      app.use(kawapp.parseQuery());
      app.start(req);
    });
  };
}
