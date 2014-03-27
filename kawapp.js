/*! kawapp.js */

/**
 * Kyukou asynchronous Web application framework
 */

/**
 * Application class.
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

  /**
   * Alias to `kawapp.END`.
   *
   * @member {Object} kawapp.prototype.END
   */
  /**
   * A signature to terminate the middleware sequence.
   *
   * @member {Object} kawapp.END
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
   * Alias to `kawapp.SKIP`.
   *
   * @member {Object} kawapp.prototype.SKIP
   */
  /**
   * A signature to skip the middleware sequence.
   *
   * @member {Object} kawapp.SKIP
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
   * This installs middleware(s).
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
    for (var i = 0; i < arguments.length; i++) {
      this[this.length++] = arguments[i];
    }
    return this; // method chaining
  };

  /**
   * This installs middleware(s) which are invoked when conditional function returns true.
   * @param {Function} cond - Conditional function
   * @param {...Function} mw - Middleware(s) to install
   * @returns {kawapp}
   * @example
   * var app = kawapp();
   *
   * app.useif(test, mw1, mw2);     // mw1&mw2 will be invoked only when condition is true
   *
   * app.use(mw3, mw4);             // mw3&mw4 will be invoked only when condition is false
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
   * This installs middleware(s) which are invoked when `location.pathname` matches.
   *
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
   * app.mount("/detail/", mw1, mw2, mw3);  // multiple middlewares to install
   */
  kawapp.prototype.mount = function(path, mw) {
    var args = Array.prototype.slice.call(arguments, 1);

    // insert location middleware at the first use of mount()
    if (!this.mounts) {
      this.use(kawapp.mw.location());
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
   * This invokes a kawapp application.
   *
   * @param {Object} [req] - context object a.k.a. `locals`
   * @param {response|jQuery|cheerio} [res] - response element such as jQuery object
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
    var array = Array.prototype.slice.call(this);
    var mw = kawapp.mw.merge.apply(null, array);
    mw(req, res, end);
    return this;

    function end(err) {
      if (err === kawapp.END) err = null;
      if (callback) callback(err, res);
    }
  };
})(kawapp);

/**
 * Utility functions.
 * This provides the following function but no constructor.
 * @class kawapp.util
 */

(function(kawapp) {
  var util = kawapp.util || (kawapp.util = {});

  /**
   * Alias to `kawapp.util`.
   *
   * @member {kawapp.util} kawapp.prototype.util
   */
  kawapp.prototype.util = util;

  /**
   * This parses query parameters.
   *
   * @method kawapp.util.parseParam
   * @see https://gist.github.com/kawanet/8384773
   * @param {String} query string
   * @returns {Object} parameter parsed
   * @example
   * // parse query parameters after "?"
   * var param1 = kawapp.util.parseParam(location.search.substr(1));
   *
   * // parse query parameters after "#!" hash bang
   * if (location.hash.search(/^#!.*\?/) > -1) {
   *   var param2 = kawapp.util.parseParam(location.hash.replace(/^#!.*\?/, ""))
   * }
   */

  util.parseParam = function(query) {
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
  };
})(kawapp);

/**
 * This provides following functions which return middlewares.
 * No constructor.
 * @class kawapp.mw
 */

(function(kawapp) {
  var mw = kawapp.mw || (kawapp.mw = {});
  /**
   * Alias to `kawapp.mw`.
   *
   * @member {kawapp.mw} kawapp.prototype.mw
   */
  kawapp.prototype.mw = mw;

  /**
   * This returns a single middleware combined
   * with multiple middlewares (or kawapp applications).
   *
   * @method kawapp.mw.merge
   * @param {...Function} mw - middlewars or applications
   * @returns {Function} middleware merged
   * @example
   * var app = kawapp();
   *
   * app.use(kawapp.mw.merge(mw1, mw2, mw3));
   */
  mw.merge = function(mw) {
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
          var array = Array.prototype.slice.call(mw);
          mw = kawapp.mw.merge.apply(null, array);
        }
        mw(req, res, iterator);
      }
    }
  };

  /**
   * This returns a middleware to set `location` object.
   * This would be great when running kawapp not on a browser environment.
   *
   * @method kawapp.mw.location
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
  mw.location = function(defaults) {
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
   * This returns a middleware to parse parameters at `location.search`.
   *
   * @method kawapp.mw.parseQuery
   * @param {String} [root] - root key to set parsed queries such as `"param"`
   * @param {String} [defaults] - default location.search string such as `"?key=value"`
   * @returns {Function} middleware
   * @example
   * var app = kawapp();
   *
   * app.use(kawapp.mw.parseQuery("param", "?key=value"));
   *
   * app.use(function(req, res, next) {
   *   console.log(req.param.key); // => "value"
   *   next();
   * });
   */
  mw.parseQuery = function(root, defaults) {
    return _parseQuery;

    function _parseQuery(req, res, next) {
      if (req.locationSearch) return next(); // already parsed
      kawapp.mw.location()(req, res, function(err) {
        if (err) return next(err);
        return parseQuery(req, res, next);
      });
    }

    function parseQuery(req, res, next) {
      if (root && !req[root]) req[root] = {};
      var param = root ? req[root] : req;
      var q = req.location.search || defaults;
      if (q && q.length > 1) {
        var p = req.locationSearch = kawapp.util.parseParam(q.substr(1));
        for (var key in p) {
          param[key] = p[key];
        }
      }
      next();
    }
  };

  /**
   * This returns a middleware to parse parameters at `location.hash`.
   *
   * @method kawapp.mw.parseHash
   * @param {String} [root] - root key to set parsed queries such as `"param"`
   * @param {String} [defaults] - default location.hash string such as `"#!?key=value"`
   * @returns {Function} middleware
   * @example
   * var app = kawapp();
   *
   * app.use(kawapp.parseHash("param", "#!?key=value"));
   *
   * app.use(function(req, res, next) {
   *   console.log(req.param.key); // => "value"
   *   next();
   * });
   */
  mw.parseHash = function(root, defaults) {
    return _parseHash;

    function _parseHash(req, res, next) {
      if (req.locationHash) return next(); // already parsed
      kawapp.mw.location()(req, res, function(err) {
        if (err) return next(err);
        return parseHash(req, res, next);
      });
    }

    function parseHash(req, res, next) {
      if (root && !req[root]) req[root] = {};
      var param = root ? req[root] : req;
      var q = req.location.hash || defaults;
      if (q && q.search(/^#!.*\?/) > -1) {
        var p = req.locationHash = kawapp.util.parseParam(q.replace(/^#!.*\?/, ""));
        for (var key in p) {
          param[key] = p[key];
        }
      }
      next();
    }
  };
})(kawapp);

/**
 * This is an alternative lightweight response class.
 * On node.js environment, use a jQuery or cheerio object instead.
 * On browser environment, use a jQuery object for most purpose.
 * This is a reference implementation to define a common interface for response objects.
 *
 * @class kawapp.response
 */
(function(kawapp) {
  kawapp.response = response;

  function response() {
    if (!(this instanceof response)) return new response();
    this[0] = [];
  }

  /**
   * This always returns 1.
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
   * This flushes the current response element.
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
   * This appends a block of HTML to the response element.
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
   * This replaces or retrieves HTML source of the response element.
   *
   * @method kawapp.response.prototype.html
   * @param {String} [html] - HTML to replace
   * @returns {String|response} HTML to retrieve, or response element for method chaining.
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
})(kawapp);
