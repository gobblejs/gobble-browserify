var _browserify = require( 'browserify' );
var join = require( 'path' ).join;
var fs = require( 'fs' );

module.exports = function browserify ( inputdir, outputdir, options, callback ) {
	if ( !options.dest ) {
		throw new Error( 'You must specify a `dest` property' );
	}

	if ( !options.entries ) {
		throw new Error( 'You must specify one or more entry points as `options.entries`' );
	}

	options.basedir = inputdir;

	_browserify( options ).bundle( function ( err, buffer ) {
		if ( err ) {
			return callback( err );
		}

		fs.writeFile( join( outputdir, options.dest ), buffer, callback );
	});
};
