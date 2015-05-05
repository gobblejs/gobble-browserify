var _browserify = require( 'browserify' );
var path = require( 'path' );
var fs = require( 'fs' );

function ensureArray ( thing ) {
	if ( thing == null ) {
		return [];
	}

	if ( !Array.isArray( thing ) ) {
		return [ thing ];
	}

	return thing;
}

module.exports = function browserify ( inputdir, outputdir, options, callback ) {
	if ( !options.dest ) {
		throw new Error( 'You must specify a `dest` property' );
	}

	if ( !options.entries ) {
		throw new Error( 'You must specify one or more entry points as `options.entries`' );
	}

	options.basedir = inputdir;

	var b = _browserify( options );

	// make it possible to expose particular files, without the nutty API.
	// Example:
	//     gobble( 'browserify', {
	//       entries: [ './app' ],
	//       dest: 'app.js',
	//       standalone: 'app',
	//       expose: { ractive: 'ractive/ractive-legacy.js' }  // <-- use ractive-legacy instead of modern build
	//     })
	if ( options.expose ) {
		Object.keys( options.expose ).forEach( function ( moduleName ) {
			b.require( options.expose[ moduleName ], { expose: moduleName });
		});
	}

	// allow ignore and exclude to be passed as arrays/strings, rather
	// than having to use options.configure
	[ 'ignore', 'exclude' ].forEach( function ( method ) {
		ensureArray( options[ method ] ).forEach( function ( option ) {
			b[ method ]( option );
		});
	});

	if ( options.configure ) {
		options.configure( b );
	}

	var stream = b.bundle();
	stream.on( 'error', callback );
	stream.on( 'end', callback );

	stream.pipe( fs.createWriteStream( path.join( outputdir, options.dest ) ) );
};