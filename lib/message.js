/* jslint node: true, esnext: true */
"use strict";

const os = require('os');
const uuid = require('uuid-js');
const cloneDeep = require('clone-deep');
const merge = require('merge-light');

class Message {
	/**
	 * The message is the element traveling through the system.
	 * @param header The header to use for this Message
	 * @param message A message which data should be transfered to this one.
	 */
	constructor(header, message) {

		this.header = {};

		// The hops are an array of way points this message has traveled
		this.hops = [];

		// If a message was given, copy the header
		if (message) {
			if (!header) {
				header = {};
			}
			merge(this.header, header, cloneDeep(message.header));

			this.hops = cloneDeep(message.hops);
		} else if (header) {
			this.header = header;
		}

		// the payload of this message
		this.payload = {};
	}

	/**
	 * Adds a new way point to the message
	 * @param stapName The name of the current which issues this way point
	 */
	addHop(stepName) {
		this.hops.push({
			"time": Date.now(),
			"id": uuid.create(4).toString(),
			"step": stepName,
			"host": os.hostname()
		});
	}

}

module.exports = function (header, message) {
	return new Message(header, message);
};
