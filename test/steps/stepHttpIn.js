/* jslint node: true, esnext: true */
"use strict";

const http = require('http');


const baseStep = require('../../lib/step');
const messageFactory = require('../../lib/message');

class StepEventGenerator extends baseStep {
	constructor(config) {
		super(config);
	}

	/**
	 * Initializes the step
	 */
	start() {

		const self = this;
		const server = http.createServer(function (req, res) {

			const message = messageFactory(req.headers);

			req.on('data', function (chunk) {
				message.payload = chunk.toString();
				self._push("out", message);
			});

			res.writeHead(200, {
				'Content-Type': 'text/plain'
			});
			res.end('ok');
		}).listen(9615);

	}



	/**
	 * This method should be overwritten by the dreived class to setup the endpoints
	 * for this step.
	 */
	_setupEndpoints() {
		// do nothing. Should be imlemented by the drived class
		this._addEndpointFromConfig({
			"name": "out",
			"active": true,
			"out": true
		});
	}


}



module.exports = function (opts) {
	return new StepEventGenerator(opts);
};
