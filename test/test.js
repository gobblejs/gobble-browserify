// var assert = require( 'assert' );
var gobble = require( 'gobble' );
var gobbleBrowserify = require( '../' );
var path = require( 'path' );
var sander = require( 'sander' );
var sourceMap = require( 'source-map' );
require( 'chai' ).should();

const buildConfig = {
	dest: path.resolve( __dirname, 'dist' ),
	gobbledir: path.resolve( __dirname, '.gobble' ),
	force: true
};

/**
 * Returns an absolute path to a fixture directory / file
 *
 * @param {String} relativePath path relative to `'fixtures/'`
 * @param {String}
 */
function fixturePath ( relativePath ) {
	return path.join( __dirname, 'fixtures', relativePath );
}
/**
 * Returns an absolute path to a gobble compiled directory / file
 *
 * @param {String} relativePath path relative to `buildConfig.dest`
 * @param {String}
 */
function outputPath ( relativePath ) {
	return path.join( buildConfig.dest, relativePath );
}

afterEach( function () {
	// delete output files
	return sander.Promise.all([
		sander.rimraf( buildConfig.dest ),
		sander.rimraf( buildConfig.gobbledir )
	]);
});

describe( 'when used with local dependencies', function () {
	beforeEach( function () {
		return gobble( fixturePath( 'local' ) )
			.transform( gobbleBrowserify, {
				entries: 'index.bundle.js',
				dest: 'local.js',
				standalone: 'local'
			} )
			.build( buildConfig );
	});

	it( 'should resolve local dependencies', function () {
		require( outputPath( 'local.js' ) ).should.equal( true );
	});

	it( 'should generate correct sourcemap', function () {
		return sander.readFile( outputPath( 'local.js.map' ) )
			.then( function ( sourcemap ) {
				var consumer = new sourceMap.SourceMapConsumer( JSON.parse( sourcemap ) );
				var originalPosition = consumer.originalPositionFor( {
					line: 3,
					column: 1
				});

				originalPosition.source.should.match( /foo\.js$/ );
				originalPosition.line.should.equal( 2 );
			});
	});
});
