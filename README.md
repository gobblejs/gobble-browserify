# gobble-browserify

Bundle CommonJS modules with gobble and Browserify

## Installation

First, you need to have gobble installed - see the [gobble readme](https://github.com/gobblejs/gobble) for details. Then,

```bash
npm i -D gobble-browserify
```

## Usage

Given a file src/js/app.js that includes browserify-type require() statements in it:

```js
var gobble = require( 'gobble' );
module.exports = gobble( 'src' ).transform( 'browserify', {
  // Files to include, relative to `src`. Can be string or array
  entries: './js/app.js',

  // The file that will be generated
  dest: 'bundle.js',

  // If supplied, this function will be called with the
  // bundle object for advanced configuration, e.g. transforms
  configure: function ( bundle ) {
    /* do stuff here */
  },

  // `ignore` and `exclude` will be applied to the bundle,
  // you don't have to use `configure`. Can be string or array
  ignore: 'foo',

  // this allows you to specify a particular file to use for a
  // given module, rather than using the normal resolution
  // algorithm. For example, to use the legacy version of
  // Ractive.js instead of the default...
  expose: {
    ractive: 'ractive/ractive-legacy.js'
  }

  // all other options are passed straight through to browserify
});
```


## License

MIT. Copyright 2014 Rich Harris
