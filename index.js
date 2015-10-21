var _browserify = require( 'browserify' );
var path = require( 'path' );
var fs = require( 'fs' );

var SOURCEMAPPING_URL = 'sourceMa';
SOURCEMAPPING_URL += 'ppingURL';
var SOURCEMAP_COMMENT = new RegExp( '\\/\\/[#@]\\s+' + SOURCEMAPPING_URL + '=([^\\s\'"]+)\s*$', 'gm' );

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

function cacheDependency ( cache, dep, inputdir ) {
  
	dep.basedir && ( dep.basedir = dep.basedir.replace( inputdir, '@' ) );
	dep.id = dep.id.replace( inputdir, '@' );
	dep.file = dep.file.replace( inputdir, '@' );

	if ( dep.deps ) {
		Object.keys( dep.deps ).forEach( function ( key ) {
			dep.deps[ key ] = dep.deps[ key ].replace( inputdir, '@' );
		});
	}

	cache[ dep.id ] = dep;
}

var leadingAt = /^@/;

function generateCacheObject ( previous, inputdir, changes ) {
	var invalid = {}, cache = {};

	changes.forEach( function ( change ) {
		if ( change.changed || change.removed ) {
			invalid[ '@' + change.file ] = invalid[ './' + change.file ] = true;
		}
	});

	Object.keys( previous ).forEach( function ( id ) {
		if ( invalid[ id ] ) return;

		var dep = previous[ id ];

		dep.basedir && ( dep.basedir = dep.basedir.replace( leadingAt, inputdir ) );
		dep.file = dep.file.replace( leadingAt, inputdir );

		if ( dep.deps ) {
			Object.keys( dep.deps ).forEach( function ( key ) {
				dep.deps[ key ] = dep.deps[ key ].replace( leadingAt, inputdir );
			});
		}

		if ( id[0] === '@' ) {
			id = inputdir + id.slice( 1 );
			dep.id = id;
		}

		cache[ id ] = dep;
	});

	return cache;
}

module.exports = function browserify ( inputdir, outputdir, options, callback ) {
	if ( !options.dest ) {
		throw new Error( 'You must specify a `dest` property' );
	}

	if ( !options.entries ) {
		throw new Error( 'You must specify one or more entry points as `options.entries`' );
	}

	// TODO should have a proper, documented way of doing this... e.g. `this.state`.
	// Ditto for this.node.cache
	if ( !this.node.packageCache ) {
		this.node.packageCache = {};
	}

	options.basedir = inputdir;
	var debug = options.debug = options.debug !== false; // sourcemaps by default
	options.cache = this.node.cache = generateCacheObject( this.node.cache || {}, inputdir, this.changes );
	options.packageCache = this.node.packageCache;
	options.fullPaths = true;

	var b = _browserify( options );
	var cache = options.cache;

	b.on( 'dep', function ( dep ) {
		cacheDependency( cache, dep, inputdir );
	});

	// TODO watch dependencies outside inputdir, using a future
	// gobble API - https://github.com/gobblejs/gobble/issues/26

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

	b.bundle( function ( err, bundle ) {
		if ( err ) return callback( err );

		bundle = bundle.toString();

		var dest = path.join( outputdir, options.dest );
		var lastSourceMappingURL;

		// browserify leaves sourceMappingURL comments in the files it bundles. This is
		// incorrect, as browsers (and other sourcemap tools) will assume that the URL
		// is for the bundle's own map, whether or not there is one. So we remove them,
		// and store the value of the last one in case we need to process it
		bundle = bundle.replace( SOURCEMAP_COMMENT, function ( match, url, a ) {
			lastSourceMappingURL = url;
			return '';
		});

		if ( debug && lastSourceMappingURL ) {
			var base64Match = /base64,(.+)/.exec( lastSourceMappingURL );

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
			bundle += '\n//# sourceMappingURL=' + path.basename( mapFile );

			fs.writeFile( dest, bundle, function () {
				fs.writeFile( mapFile, JSON.stringify( map ), callback );
			});
		} else {
			fs.writeFile( dest, bundle, callback );
		}
	});
};
