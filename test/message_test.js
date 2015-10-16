/*global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const Endpoint = require('../lib/endpoint');
const messageFactory = require('../lib/message');


describe("Message", function () {


	it('create empty message', function (done) {
		const msg = messageFactory();

		assert.deepEqual(msg, {
			"header": {},
			"hops": [],
			"payload": {}
		});

		done();
	});

	it('create message with header', function (done) {
		const msg = messageFactory({
			"my": "name"
		});

		assert.deepEqual(msg, {
			"header": {
				"my": "name"
			},
			"hops": [],
			"payload": {}
		});

		done();
	});

	it('create message from existing message', function (done) {
		const msg = messageFactory({
			"my": "name"
		});

		const msgNew = messageFactory(undefined, msg);

		assert.deepEqual(msgNew, {
			"header": {
				"my": "name"
			},
			"hops": [],
			"payload": {}
		});

		done();
	});


});
