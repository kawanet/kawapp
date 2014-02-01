/*! kawapp.js */

/**
 * Kyukou asynchronous Web application framework
 */

/**
 * Application class
 * @constructor
 */
function kawapp() {
  if (!(this instanceof kawapp)) return new kawapp();
}

(function(kawapp) {
  // for node.js environment
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = kawapp;
  }

  kawapp.request = Object;
  kawapp.response = response;

  /**
   * @type {anonymous} Flag to terminate the middleware sequence.
   */
  kawapp.END = { end: true };

  /**
   * @type {anonymous} Flag to skip the middleware sequence.
   */
  kawapp.SKIP = { skip: true };

  /**
   * @type {number} Number of middlewares installed
   */
  kawapp.prototype.length = 0;

  /**
   * Install middlewares.
   * @param {...Function} mw - Middleware(s) to install
   */
  kawapp.prototype.use = function(mw) {
    for (var i in arguments) {
      this[this.length++] = arguments[i];
    }
    return this; // method chaining
  };

  /**
   * Install middlewares which are invoked when conditional function returns true.
   * @param {Function} cond - Conditional function
   * @param {...Function} mw - Middleware(s) to install
   */
  kawapp.prototype.useif = function(cond, mw) {
    var args = Array.prototype.slice.call(arguments, 1);
    var subapp = kawapp();
    subapp.use(useif);
    subapp.use.apply(subapp, args);
    subapp.use(end);

    // this.when(useif, mw, ...)
    return this.use(subapp);

    function useif(req, res, next) {
      var ret = cond(req);
      if (ret instanceof Error) {
        next(ret);
      } else {
        next(ret ? null : kawapp.SKIP);
      }
    }

    function end(req, res, next) {
      next(kawapp.END);
    }
  };

  /**
   * Install middlewares which are invoked when path matches.
   * @param {String} path
   * @param {...Function} mw - Middleware(s) to install
   */
  kawapp.prototype.mount = function(path, mw) {
    var args = Array.prototype.slice.call(arguments, 1);

    // insert location middleware at the first use of mount()
    if (!this.mounts) {
      this.use(kawapp.location());
      this.mounts = 0;
    }
    this.mounts++;
    args.unshift(mount);
    return this.useif.apply(this, args);

    function mount(req, res, next) {
      var str = req.location.pathname;
      if (!str) return;
      if (path instanceof RegExp) {
        return path.test(str);
      } else {
        return (str.search(path) === 0);
      }
    }
  };

  /**
   * Start application.
   * @param [req] - context object or request object
   * @param [res] - response object such as jQuery instance
   * @param {Function} [callback] - callback function
   * @returns {kawapp}
   */
  kawapp.prototype.start = function(req, res, callback) {
    // both request and response are optional
    if (arguments.length == 1 && "function" === typeof req) {
      callback = req;
      req = null;
    } else if (arguments.length == 2 && "function" === typeof res) {
      callback = res;
      res = null;
    }

    // default parameteres
    if (!req) req = this.req || kawapp.request();
    if (!res) res = this.res || kawapp.response();

    // compile kawapp as a middleware and run it
    var mw = kawapp.merge.apply(null, this);
    mw(req, res, end);
    return this;

    function end(err) {
      if (err === kawapp.END) err = null;
      if (callback) callback(err, res);
    }
  };

  /**
   * Merge multiple middlewares and applications as a single middleware.
   * @param {...Function} mw - middlewars or applications
   * @returns {Function} middleware merged
   */
  kawapp.merge = function(mw) {
    var args = arguments;
    return merge;

    function merge(req, res, next) {
      var idx = 0;
      iterator();

      function iterator(err) {
        if (err || idx >= args.length) {
          if (err === kawapp.SKIP) err = null;
          next(err);
          return;
        }
        mw = args[idx++];
        if (mw instanceof kawapp) {
          mw = kawapp.merge.apply(null, mw);
        }
        mw(req, res, iterator);
      }
    }
  };

  /**
   * Middleware to set location
   * @param {Object} [defaults] - default location object
   * @returns {Function} middleware
   */
  kawapp.location = function(defaults) {
    /* global location */
    return _location;

    function _location(req, res, next) {
      if (!req.location) {
        req.location = ("undefined" !== typeof location) ? location : defaults || {};
      }
      next();
    }
  };

  /**
   * Middleware to parse location.search e.g. `/index.html?key=value`
   * @param {String} [defaults] - default location.search string
   * @returns {Function} middleware
   * @example
   * var app = kawapp();
   * app.use(kawapp.locationSearch());             // without defaults
   * app.use(kawapp.locationSearch("?key=value")); // with defaults
   */
  kawapp.parseQuery = function(defaults) {
    return _parseQuery;

    function _parseQuery(req, res, next) {
      if (req.locationSearch) return next();
      kawapp.location()(req, res, function(err){
        if (err) return next(err);
        return parseQuery(req, res, next);
      });
    }

    function parseQuery(req, res, next) {
      var q = req.location.search || defaults;
      if (q && q.length > 1) {
        var p = req.locationSearch = parse_query_param(q.substr(1));
        for (var key in p) {
          req[key] = p[key];
        }
      }
      next();
    }
  };

  /**
   * Middleware to parse location.hash e.g. `/index.html#!?key=value`
   * @param {String} [defaults] - default location.hash string
   * @returns {Function} middleware
   * @example
   * var app = kawapp();
   * app.use(kawapp.locationHash());               // without defaults
   * app.use(kawapp.locationHash("#!?key=value")); // with defaults
   */
  kawapp.parseHash = function(defaults) {
    return _parseHash;

    function _parseHash(req, res, next) {
      if (req.locationHash) return next();
      kawapp.location()(req, res, function(err){
        if (err) return next(err);
        return parseHash(req, res, next);
      });
    }

    function parseHash(req, res, next) {
      var q = req.location.hash || defaults;
      if (q && q.search(/^#!.*\?/) > -1) {
        var p = req.locationHash = parse_query_param(q.replace(/^#!.*\?/, ""));
        for (var key in p) {
          req[key] = p[key];
        }
      }
      next();
    }
  };

  /**
   * Alternative lightwight response class.
   * On node.js environment, use a jQuery or cheerio object instead.
   * On browser environment, use a jQuery object instead.
   * @constructor
   */
  function response() {
    if (!(this instanceof response)) return new response();
    this[0] = [];
  }

  /**
   * Always returns 1. This allows a response behaves Array-like object.
   * @type {number}
   */
  response.prototype.length = 1;

  /**
   * Flush response.
   * @returns {response} for method chaining.
   */
  response.prototype.empty = function() {
    this[0].length = 0;
    return this;
  };

  /**
   * Append a block of HTML.
   * @returns {response} for method chaining.
   */
  response.prototype.append = function() {
    var args = Array.prototype.slice.call(arguments);
    args.forEach(function(item) {
      this[0].push(item);
    });
    return this;
  };

  /**
   * Update or retrieve response HTML.
   */
  response.prototype.html = function(html) {
    if (arguments.length) {
      // update HTML contents
      this.empty().append(html);
      return this;
    } else {
      // retrieve HTML contents
      var array = this[0].map(function(elem) {
        if ("object" === typeof elem) {
          if (elem.cheerio) {
            // cheerio has a toString() method
            return elem;
          } else if (elem.jquery) {
            // jQuery does not have outerHTML feature
            var jQuery = elem.constructor;
            var wrap = new jQuery("<div/>");
            elem = elem.first();
            if (elem.parent().length) elem = elem.clone();
            var html = wrap.append(elem).html();
            return html;
          } else if (elem.hasOwnProperty("outerHTML")) {
            // elem is a HTMLElement
            return elem.outerHTML;
          }
        }
        return elem;
      });
      return array.join("");
    }
  };

  /**
   * @private
   * @see https://gist.github.com/kawanet/8384773
   * @param {String} query string
   * @returns {Object} parameter
   * @example
   * var param1 = parse_query_param(location.search.substr(1));
   * var param2 = parse_query_param(location.hash.search(/^#!.*\?/)?"":location.hash.replace(/^#!.*\?/, ""))
   */

  function parse_query_param(query) {
    var vars = query.split(/[&;]/);
    var param = {};
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i];
      if (!pair.length) continue;
      var pos = pair.indexOf("=");
      var key, val;
      if (pos > -1) {
        key = pair.substring(0, pos);
        val = pair.substring(pos + 1);
      } else {
        key = val = pair;
      }
      key = key.replace(/\+/g, " ");
      val = val.replace(/\+/g, " ");
      key = decodeURIComponent(key);
      val = decodeURIComponent(val);
      param[key] = val;
    }
    return param;
  }
})(kawapp);
