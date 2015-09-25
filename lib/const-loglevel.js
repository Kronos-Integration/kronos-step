/* jslint node: true, esnext: true */
"use strict";

const LOG_LEVEL = {
	'trace': {
		name: 'trace',
		priority: 10000
	},
	'debug': {
		name: 'debug',
		priority: 1000
	},
	'info': {
		name: 'info',
		priority: 100
	},
	'warn': {
		name: 'warn',
		priority: 10
	},
	'error': {
		name: 'error',
		priority: 1
	}
};

module.exports = LOG_LEVEL;
