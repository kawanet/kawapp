var assert = require("assert");
var kawapp = require("../kawapp");

var filename = __filename.replace(/.*\//, "") + ":";
describe(filename, tests(kawapp));

function tests(kawapp) {
  return function() {
    describe('mount', function() {
      var app = kawapp();
      app.mount("/foo/bar/", function(context, canvas, next) {
        if (context.path) return next(context.path);
        context.path = "/foo/bar/";
        next();
      });
      app.mount("/foo/", function(context, canvas, next) {
        if (context.path) return next(context.path);
        context.path = "/foo/";
        next();
      });
      app.mount("/", function(context, canvas, next) {
        if (context.path) return next(context.path);
        context.path = "/";
        next();
      });
      mount_tests(app);
    });

    describe('mount by regexp', function() {
      var app = kawapp();
      app.mount(/^\/foo\/bar\//, function(context, canvas, next) {
        if (context.path) return next(context.path);
        context.path = "/foo/bar/";
        next();
      });
      app.mount(/^\/foo\//, function(context, canvas, next) {
        if (context.path) return next(context.path);
        context.path = "/foo/";
        next();
      });
      app.mount(/^\//, function(context, canvas, next) {
        if (context.path) return next(context.path);
        context.path = "/";
        next();
      });
      mount_tests(app);
    });
  };
}

function mount_tests(app) {
  it('pathname: /foo/bar/', function(done) {
    var context = { location: { pathname: "/foo/bar/"} };
    app.start(context, null, function(err) {
      assert(!err, err);
      assert.equal(context.path, "/foo/bar/");
      done();
    });
  });
  it('pathname: /foo/buz/', function(done) {
    var context = { location: { pathname: "/foo/buz/"} };
    app.start(context, null, function(err) {
      assert(!err, err);
      assert.equal(context.path, "/foo/");
      done();
    });
  });
  it('pathname: /', function(done) {
    var context = { location: { pathname: "/"} };
    app.start(context, null, function(err) {
      assert(!err, err);
      assert.equal(context.path, "/");
      done();
    });
  });
  it('pathname: /index.html', function(done) {
    var context = { location: { pathname: "/index.html"} };
    app.start(context, null, function(err) {
      assert(!err, err);
      assert.equal(context.path, "/");
      done();
    });
  });
  it('pathname: /foo/bar/index.html', function(done) {
    var context = { location: { pathname: "/foo/bar/index.html"} };
    app.start(context, null, function(err) {
      assert(!err, err);
      assert.equal(context.path, "/foo/bar/");
      done();
    });
  });
}