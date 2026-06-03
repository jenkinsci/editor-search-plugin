import * as esbuild from 'esbuild';

const options = {
	entryPoints: ['src-js/main.mjs'],
	outfile: 'src/main/resources/io/jenkins/plugins/editorsearch/editor-search.js',

	bundle: true,
	format: 'iife',
	target: 'es2020',

	// minifyWhitespace: true,
	minifyWhitespace: false,
	minifySyntax: true,
	minifyIdentifiers: false,

	legalComments: 'none',

	sourcemap: false
};

if (process.argv.includes('--watch')) {
	const ctx = await esbuild.context(options);
	await ctx.watch();

	console.log('Watching...');
} else {
	await esbuild.build(options);
}