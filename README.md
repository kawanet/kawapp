# Kawapp

Kyukou asynchronous Web application framework

## Synopsis

```js
var kawapp = require("kawapp");  // for node.js

// setup application
var app = kawapp();
app.use(kawapp.parseQuery());    // index.html?name=Ken
app.use(kawapp.parseHash());     // index.html#!?name=Alex
app.mount("/about/", about);
app.mount("/contact/", contact);
app.use(notfound);

// run application
var req = { name: "John" };
var res = $("#canvas");
app.start(req, res, end);

// page middlewares
function about(req, res, next) {
  res.empty().append("my name is " + req.name);
  next();
}

function contact(req, res, next) {
  res.html('<a href="http://twitter.com/kawanet">@kawanet</a>');
  next();
}

function notfound(req, res, next) {
  next(new Error("invalid request"));
}

// callback at last
function end(err, res) {
  if (err) console.log('err', err);
}
```

See [API reference](http://kawanet.github.io/kawapp/docs/kawapp.html) for more detail:

## Kawapp is...

* simple. No special classes or objects other than Kawapp are required.
  This uses a plain object to manage request context (locals).
  This uses a jQuery object to draw a response content, on the other hand.
  jQuery is not required, in fact, as Kawapp includes a mini-subset of jQuery.

* a framework which run on browser environments, of course.
  Kawapp works perfect for modern Ajax applications.

* a framework which run on node.js environment as well.
  Kawapp works gorgeous for CGI-style web applications.
  This means your same code could perform on both side of server and client.
  Lean jQuery clone [Cheerio](https://npmjs.org/package/cheerio) is also
  available to run this on node.js.

* test ready.
  Node.js's test frameworks would help you to develop client applications as well.

* super light-weight. Minified version of this only take 3KB.

## Kawapp is NOT...

* a template engine. Use well known template engines such as
  [Hogan.js](http://twitter.github.io/hogan.js/),
  [Handlebars.js](http://handlebarsjs.com), etc.
  Kawapp works great with those third party engines.

* a HTTP server. Use [Express.js](http://expressjs.com) as usual.

## Links

* http://kawanet.github.io/kawapp/docs/kawapp.html -
  API reference

* https://raw.github.com/kawanet/kawapp/master/kawapp.js -
  source

* https://raw.github.com/kawanet/kawapp/master/dist/kawapp.min.js -
  minified (3KB)

## Note

"Kyukou" means "Express" in Japanese.

## MIT Licence

Copyright 2014 @kawanet Yusuke Kawasaki

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
