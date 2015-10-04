/* jslint node: true, esnext: true */
"use strict";

const os = require('os');
const uuid = require('uuid-js');
const cloneDeep = require('clone-deep');
const merge = require('merge-light');

const MESSAGE_STATUS = require('./const-message-status');


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

		// There are some internal control messages
		this.messageType = MESSAGE_STATUS.default;

		// the payload of this message
		this.payload = {};
	}

	/**
	 * Make this message a stop message.
	 * Only a new empty message could be converted to a stop message
	 */
	makeStopMessaage() {
		if (this.hops.length === 0) {
			this.messageType = MESSAGE_STATUS.stop;
		}
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
