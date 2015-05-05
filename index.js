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

function concat ( stream, callback ) {
	var body = '';

	stream.on( 'data', function ( chunk ) {
		body += chunk.toString();
	});

	stream.on( 'end', function () {
		callback( body );
	});
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

	var dest = path.join( outputdir, options.dest );

	if ( options.debug ) {
		// we're expecting a base64-encoded sourcemap. Unfortunately, the sourcemap
		// browserify generates contains paths that are relative to `inputdir`, when
		// they should be relative to `outputdir`. To my knowledge, there's no way
		// to correct that, so we intercept the sourcemap ourselves. It's frustrating
		// that browserify won't allow you to generate a sourcemap separately, but whatever
		concat( stream, function ( bundle ) {
			var index = bundle.lastIndexOf( '//# sourceMappingURL=' );

			if ( !~index ) {
				// huh, weird
				return fs.writeFile( dest, bundle, callback );
			}

			var dataURL = bundle.substring( index + 21 );
			var base64Match = /base64,(.+)/.exec( dataURL );

			if ( !base64Match ) {
				callback( new Error( 'Expected to find a base64-encoded sourcemap data URL' ) );
			}

			var json = new Buffer( base64Match[1], 'base64' ).toString();
			var map = JSON.parse( json );

			// Override sources - make them absolute
			map.sources = map.sources.map( function ( relativeToInputdir ) {
				return path.resolve( inputdir, relativeToInputdir );
			});

			json = JSON.stringify( map );

			var mapFile = dest + '.map';

			// we write the sourcemap out as a separate .map file. Keeping it as an
			// inline data URL is silly
			bundle = bundle.substr( 0, index ) + '//# sourceMappingURL=' + path.basename( mapFile );

			fs.writeFile( dest, bundle, function () {
				fs.writeFile( mapFile, JSON.stringify( map ), callback );
			});
		});
	}

	else {
		// no sourcemap expected - pipe bundle straight to the file system
		stream.pipe( fs.createWriteStream( dest ) );
		stream.on( 'end', callback );
	}
};