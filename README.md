# gobble-sass

Bundle CommonJS modules with gobble and Browserify

## Installation

First, you need to have gobble installed - see the [gobble readme](https://github.com/gobblejs/gobble) for details. Then,

```bash
npm i -D gobble-browserify
```

## Usage

```js
var gobble = require( 'gobble' );
module.exports = gobble( 'src' ).transform( 'browserify', {
  entries: 'js/app.scss', // can be string or array
  dest: 'bundle.js'
});
```


## License

MIT. Copyright 2014 Rich Harris
