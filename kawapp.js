/*! kawapp.js */

/**
 * Kyukou asynchronous Web application framework
 */

/**
 * Application class
 * @class kawapp
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
   * Signal to terminate the middleware sequence.
   *
   * @member {anonymous} kawapp.END
   */
  /**
   * Signal to terminate the middleware sequence.
   *
   * @member {anonymous} kawapp.prototype.END
   * @example
   * var app = kawapp();
   *
   * app.use(function(req, res, next) {
   *   next(kawapp.END); // send END signal to stop the application
   * });
   *
   * app.use(other_mw);  // this middleware will never be invoked
   */
  kawapp.prototype.END = kawapp.END = { end: true };

  /**
   * Signal to skip the middleware sequence.
   *
   * @member {anonymous} kawapp.SKIP
   */
  /**
   * Signal to skip the middleware sequence.
   *
   * @member {anonymous} kawapp.prototype.SKIP
   * @example
   * var sub = kawapp();
   * sub.use(function(req, res, next) {
   *   next(kawapp.SKIP);
   * });
   * sub.use(mw1); // this middleware will never be invoked
   *
   * var main = kawapp();
   * main.use(sub);
   * main.use(mw2); // this middleware will be invoked otherwise
   */
  kawapp.prototype.SKIP = kawapp.SKIP = { skip: true };

  /**
   * Number of middlewares installed.
   * This means kawapp instance behaves as an Array-like object.
   * @type {Number}
   */
  kawapp.prototype.length = 0;

  /**
   * Install middlewares.
   * @param {...Function} mw - Middleware(s) to install
   * @returns {kawapp}
   * @example
   * var app = kawapp();
   *
   * app.use(function(req, res, next) {
   *   var text = req.ok ? "OK" : "NG"; // use req as a locals
   *   res.append(text);                // use res with append() html() empty() methods
   *   next();                          // callback to chain middlewares
   * });
   *
   * app.use(function(req, res, next) {
   *   var err = new Error("something wrong");
   *   next(err);                       // send error to terminate the application
   * });
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
   * @returns {kawapp}
   * @example
   * var app = kawapp();
   *
   * app.useif(test, mw1, mw2);     // mw1&mw2 will be invoked when condition is true
   *
   * app.use(mw3, mw4);             // mw3&mw4 will be invoked when condition is false
   *
   * function test(req, res) {
   *   return (req.key == "value"); // test something
   * }
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
   * @param {String|RegExp} path - pathname to test
   * @param {...Function} mw - Middleware(s) to install
   * @returns {kawapp}
   * @example
   * var app = kawapp();
   *
   * app.mount("/about/", about_mw);        // test pathname with string
   *
   * app.mount(/^\/contact\//, contact_mw); // test pathname with regexp
   *
   * app.mount("/detail/", mw1, mw2, mw3);  // multiple middlewares to run
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
   * @param {Object} [req] - context object a.k.a. locals
   * @param {response|jQuery|cheerio} [res] - response object such as jQuery object
   * @param {Function} [callback] - callback function
   * @returns {kawapp}
   * @example
   * var app = kawapp();
   * app.use(mw1);              // install some middlewares
   *
   * var context = {};          // plain object as a request context
   * var canvas = $("#canvas"); // jQuery object as a response canvas
   *
   * app.start(context, canvas, function(err, res) {
   *   if (err) console.error(err);
   * });
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
   * Merge multiple middlewares (or kawapp applications) as a single middleware.
   * @param {...Function} mw - middlewars or applications
   * @returns {Function} middleware merged
   * @example
   * var app = kawapp();
   *
   * var mw = kawapp.merge(mw1, mw2, mw3);  // merge multiple middlewares
   *
   * app.use(mw);                           // use it as a middleware
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
   * Middleware to set location.
   * This would be great when running kawapp not on a browser environment.
   * @param {Object} [defaults] - default location object
   * @returns {Function} middleware
   * @example
   * var app = kawapp();
   *
   * var loc = {
   *   href: "http://www.example.com/about"
   * };
   * app.use(kawapp.location(loc));     // store default location
   *
   * app.use(function(req, res, next) {
   *   console.log(req.location.href);  // fetch location in a middleware
   *   next();
   * });
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
   *
   * app.use(kawapp.locationSearch());             // without defaults
   *
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
   *
   * app.use(kawapp.locationHash());               // without defaults
   *
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
   * Alternative lightweight response class.
   * On node.js environment, use a jQuery or cheerio object instead.
   * On browser environment, use a jQuery object for most purpose.
   * This class exists to define a common interface for response objects.
   *
   * @class kawapp.response
   */
  function response() {
    if (!(this instanceof response)) return new response();
    this[0] = [];
  }

  /**
   * Always returns 1.
   * Response object behaves Array-like object which has an item.
   *
   * @member {Number} kawapp.response.prototype.length
   * @example
   * var app = kawapp();
   *
   * app.use(some_mw);
   *
   * app.start(function(err, res) {
   *   $("#canvas").append(res[0]);
   * });
   */
  response.prototype.length = 1;

  /**
   * Flush the current response.
   *
   * @method kawapp.response.prototype.empty
   * @returns {response} response object for method chaining.
   * @example
   * var app = kawapp();
   *
   * app.use(function(req, res, next) {
   *   res.empty().append("hi, there!");
   * });   */
  response.prototype.empty = function() {
    this[0].length = 0;
    return this;
  };

  /**
   * Append a block of HTML to the current.
   *
   * @method kawapp.response.prototype.append
   * @param {...String} html - HTML to append
   * @returns {response} response object for method chaining.
   * @example
   * var app = kawapp();
   *
   * app.use(function(req, res, next) {
   *   res.append("foo");
   *   res.append("bar");
   * });
   */
  response.prototype.append = function() {
    var args = Array.prototype.slice.call(arguments);
    var list = this[0];
    args.forEach(function(item) {
      list.push(item);
    });
    return this;
  };

  /**
   * Replace or retrieve the current HTML.
   *
   * @method kawapp.response.prototype.html
   * @param {String} [html] - HTML to replace
   * @returns {String|response} HTML to retrieve, or response object for method chaining.
   * @example
   * var app = kawapp();
   *
   * app.use(function(req, res, next) {
   *   res.html("Hello!");
   * });
   *
   * app.start(function(err, res) {
   *   console.log(res.html());       // => "Hello!"
   * });
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
