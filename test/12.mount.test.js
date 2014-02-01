var assert = require("assert");
var kawapp = require("../kawapp");

var filename = __filename.replace(/.*\//, "") + ":";
describe(filename, tests(kawapp));

function tests(kawapp) {
  return function() {
    describe('mount', function() {
      var app = kawapp();
      app.mount("/foo/bar/", function(req, res, next) {
        if (req.path) return next(req.path);
        req.path = "/foo/bar/";
        next();
      });
      app.mount("/foo/", function(req, res, next) {
        if (req.path) return next(req.path);
        req.path = "/foo/";
        next();
      });
      app.mount("/", function(req, res, next) {
        if (req.path) return next(req.path);
        req.path = "/";
        next();
      });
      mount_tests(app);
    });

    describe('mount by regexp', function() {
      var app = kawapp();
      app.mount(/^\/foo\/bar\//, function(req, res, next) {
        if (req.path) return next(req.path);
        req.path = "/foo/bar/";
        next();
      });
      app.mount(/^\/foo\//, function(req, res, next) {
        if (req.path) return next(req.path);
        req.path = "/foo/";
        next();
      });
      app.mount(/^\//, function(req, res, next) {
        if (req.path) return next(req.path);
        req.path = "/";
        next();
      });
      mount_tests(app);
    });
  };
}

function mount_tests(app) {
  it('pathname: /foo/bar/', function(done) {
    var req = { location: { pathname: "/foo/bar/"} };
    app.start(req, null, function(err) {
      assert(!err, err);
      assert.equal(req.path, "/foo/bar/");
      done();
    });
  });
  it('pathname: /foo/buz/', function(done) {
    var req = { location: { pathname: "/foo/buz/"} };
    app.start(req, null, function(err) {
      assert(!err, err);
      assert.equal(req.path, "/foo/");
      done();
    });
  });
  it('pathname: /', function(done) {
    var req = { location: { pathname: "/"} };
    app.start(req, null, function(err) {
      assert(!err, err);
      assert.equal(req.path, "/");
      done();
    });
  });
  it('pathname: /index.html', function(done) {
    var req = { location: { pathname: "/index.html"} };
    app.start(req, null, function(err) {
      assert(!err, err);
      assert.equal(req.path, "/");
      done();
    });
  });
  it('pathname: /foo/bar/index.html', function(done) {
    var req = { location: { pathname: "/foo/bar/index.html"} };
    app.start(req, null, function(err) {
      assert(!err, err);
      assert.equal(req.path, "/foo/bar/");
      done();
    });
  });
}