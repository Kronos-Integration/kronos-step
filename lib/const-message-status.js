/* jslint node: true, esnext: true */
"use strict";

/**
 * Defines the possible states for a message
 */
const MESSAGE_STATUS = {
	'default': {
		name: 'default',
		description: "The default message for normal work"
	},
	'stop': {
		name: 'stop',
		priority: "Internal message. Each step getting this message will stop after it gets this message"
	}
};

module.exports = MESSAGE_STATUS;
