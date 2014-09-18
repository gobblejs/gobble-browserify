module.exports = function browserify ( inputdir, outputdir, options, callback, errback ) {
	var sander = require( 'sander' ),
		_browserify = require( 'browserify' ),
		b,
		stream,
		dest;

	if ( !options.dest ) {
		throw new Error( 'You must specify a `dest` property' );
	}

	if ( !options.entries ) {
		throw new Error( 'You must specify one or more entry points as `options.entries`' );
	}

	options.basedir = inputdir;

	b = _browserify( options );

	b.bundle( function ( err, buffer ) {
		if ( err ) {
			return errback( err );
		}

		sander.writeFile( outputdir, options.dest, buffer ).then( callback, errback );
	});
};
