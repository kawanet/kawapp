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
      var context = { location: loc };
      app.use(kawapp.mw.parseQuery());
      app.use(function(context, canvas, next) {
        assert.equal(context.foo, "FOO");
        assert.equal(context.buz, "BUZ");
        assert.notEqual(context.bar, "BAR");
        assert.notEqual(context.qux, "QUX");
        next();
        done();
      });
      app.start(context);
    });

    it('parseHash', function(done) {
      var app = kawapp();
      var context = { location: loc };
      app.use(kawapp.mw.parseHash());
      app.use(function(context, canvas, next) {
        assert.notEqual(context.foo, "FOO");
        assert.notEqual(context.buz, "BUZ");
        assert.equal(context.bar, "BAR");
        assert.equal(context.qux, "QUX");
        next();
        done();
      });
      app.start(context);
    });
  };
}
