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


## Usage with [gobble-ractive](https://github.com/gobblejs/gobble-ractive)

Given this directory structure:
```
./gobblefile.js
./src/component/some-component.html
./src/js/app.js
```

Then, the gobblefile.js should include:
```javascript
  gobble( 'src' ).map( 'ractive', { type: 'cjs' } ).transform( 'browserify', {
    entries: './js/app.js', // can be string or array
    dest: 'bundle.js'
  }),
```

And the javascript/app.js can include:
```javascript
var SomeComponent = require('../component/some-component');

var thing = new SomeComponent({
  el: '#id-of-the-div-where-this-component-should-be-displayed'
});
```

## License

MIT. Copyright 2014 Rich Harris
