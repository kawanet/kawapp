var assert = require("assert");
var kawapp = require("../kawapp");

var filename = __filename.replace(/.*\//, "") + ":";
describe(filename, tests(kawapp));

function tests(kawapp) {
  return function() {
    var loc = {
      search: "?foo=FOO&buz=BUZ",
      hash: "#!?bar=BAR&qux=QUX"
    };

    it('parseQuery', function(done) {
      var app = kawapp();
      var req = { location: loc };
      app.use(kawapp.parseQuery());
      app.use(function(req, res, next) {
        assert.equal(req.foo, "FOO");
        assert.equal(req.buz, "BUZ");
        assert.notEqual(req.bar, "BAR");
        assert.notEqual(req.qux, "QUX");
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
        assert.notEqual(req.buz, "BUZ");
        assert.equal(req.bar, "BAR");
        assert.equal(req.qux, "QUX");
        next();
        done();
      });
      app.use(kawapp.parseQuery());
      app.start(req);
    });
  };
}
