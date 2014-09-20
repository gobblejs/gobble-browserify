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
  entries: './js/app.js', // can be string or array, with files relative to the 'src' directory
  dest: 'bundle.js'
});
```

During debugging, running "gobble" will display error messages from Browserify (unlike "gobble build dist" which swallows error messages).

## License

MIT. Copyright 2014 Rich Harris
