import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * ESLint v10 config.
 * 
 * Run from cmd:
 * <pre>
 * npx eslint
 * </pre>
 */
export default defineConfig([
	globalIgnores([
		"target/**",
		"**/min/**",
		"**/*.priv/**",
		"**/*.min.js",
	]),

	// for tests
	{
		files: ['src-js/test/**/*.mjs'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			"no-unused-expressions": "off",
		},
	},

	// src-js
	{
		files: ['src-js/**/*.mjs'],
		plugins: {
			js,
		},
		extends: ["js/recommended"],

		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.es2020,

				// custom globals
				// Logger: "readonly",
				// app: "readonly",
			},
		},

		rules: {
			"no-unused-vars": ["error", { "args": "none" }],
			"no-redeclare": "error",
			"no-useless-escape": "off",
			"no-useless-assignment": "off",

			// maybe...
			/*
			indent: ["error", "tab", {
				SwitchCase: 1,
				ignoredNodes: ["SwitchCase"],
				ignoreComments: true,
			}],
			"linebreak-style": ["error", "windows"],
			quotes: ["error", "single"],
			semi: ["error", "always"],
			*/
		},
	},

	// bundle: src\main\resources\io\jenkins\plugins\editorsearch\editor-search.js
	{
		files: ['src/main/resources/**/*.js'],
		plugins: {
			js,
		},
		extends: ["js/recommended"],

		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "script",
			globals: {
				...globals.browser,
				...globals.es2020,
				//...globals.commonjs,

				// custom globals
				// Logger: "readonly",
				// app: "readonly",
			},
		},

		rules: {
			"no-unused-vars": ["error", { "args": "none" }],
			"no-redeclare": "error",
			"no-useless-escape": "off",
			"no-useless-assignment": "off",
			"no-empty": "off",

			// maybe...
			/*
			indent: ["error", "tab", {
				SwitchCase: 1,
				ignoredNodes: ["SwitchCase"],
				ignoreComments: true,
			}],
			"linebreak-style": ["error", "windows"],
			quotes: ["error", "single"],
			semi: ["error", "always"],
			*/
		},
	},

]);