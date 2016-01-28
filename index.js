/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step'),
	guardedEndpoint = require('./lib/guardedendpoint');
exports.guardedEndpoint = guardedEndpoint;
exports.endpoint = require('kronos-endpoint');
exports.Step = step.BaseStep;

exports.createEndpoint = function (name, definition, step) {
	console.log("deprecated use new directly");
	if (definition.in) {
		return new guardedEndpoint.GuardedReceiveEndpoint(name, step);
	} else {
		return new guardedEndpoint.GuardedSendEndpoint(name, step);
	}
};
