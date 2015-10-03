/*global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const Endpoint = require('../lib/endpoint');
const messageFactory = require('../lib/message');


describe("Endpoints", function () {


	it('Connect two endpoints with each other: in with out', function (done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"in": true,
			"passive": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"out": true,
			"active": true
		});
		epOut.step = dummyStep2;

		// connect the endpoints
		epIn.connect(epOut);

		const msg = messageFactory({
			"name": "test1"
		});

		// the receive method called by the endpoint
		dummyStep1._receive = function (endpointName, message) {
			// The receiving endpoint is the in endpoint
			assert.equal(endpointName, 'epIn');
			assert.equal(message.header.name, 'test1');
			done();
		};

		epOut.push(msg);
	});

	it('Connect two endpoints with each other: out with in', function (done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"in": true,
			"passive": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"out": true,
			"active": true
		});
		epOut.step = dummyStep2;

		// connect the endpoints
		epOut.connect(epIn);

		const msg = messageFactory({
			"name": "test1"
		});

		// the receive method called by the endpoint
		dummyStep1._receive = function (endpointName, message) {
			// The receiving endpoint is the in endpoint
			assert.equal(endpointName, 'epIn');
			assert.equal(message.header.name, 'test1');
			done();
		};

		epOut.push(msg);
	});

	it('Error: Connect two endpoints with each other: out with out', function (done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"out": true,
			"passive": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"out": true,
			"active": true
		});
		epOut.step = dummyStep2;

		// connect the endpoints
		expect(function () {
			epOut.connect(epIn);
		}).to.throw("Could not conect the endpoint 'epOut' with the endpoint 'epIn'");

		done();
	});

	it('Error: Connect two endpoints with each other: in with in', function (done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"in": true,
			"passive": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"in": true,
			"active": true
		});
		epOut.step = dummyStep2;

		// connect the endpoints
		expect(function () {
			epOut.connect(epIn);
		}).to.throw("Could not conect the endpoint 'epOut' with the endpoint 'epIn'");

		done();
	});

	it('Error: Connect two endpoints with each other: in:active with out:active', function (done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"in": true,
			"active": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"out": true,
			"active": true
		});
		epOut.step = dummyStep2;

		// connect the endpoints
		expect(function () {
			epOut.connect(epIn);
		}).to.throw("Could not conect the endpoint 'epOut' with the endpoint 'epIn'");

		done();
	});

	it('Error: Connect two endpoints with each other: in:passive with out:passive', function (done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"in": true,
			"passive": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"out": true,
			"passive": true
		});
		epOut.step = dummyStep2;

		// connect the endpoints
		expect(function () {
			epOut.connect(epIn);
		}).to.throw("Could not conect the endpoint 'epOut' with the endpoint 'epIn'");

		done();
	});


	it('Error: Connect two endpoints with each other: One of them is already connected', function (done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"in": true,
			"passive": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"out": true,
			"active": true
		});
		epOut.step = dummyStep2;

		const epEvil = new Endpoint({
			"name": "epEvil",
			"in": true,
			"passive": true
		});
		epEvil.step = dummyStep1;


		// set the second endpoint as already connected
		epOut.connect(epEvil);

		// connect the endpoints
		expect(function () {
			epOut.connect(epIn);
		}).to.throw("Could not conect the endpoint, the endpoint 'epOut' is already connected with 'epEvil'");

		done();
	});

	it('Error: Connect two endpoints with each other: One of them is already connected (other way around)', function (
		done) {
		let dummyStep1 = {
			"name": "dumyStepName_1"
		};
		let dummyStep2 = {
			"name": "dumyStepName_2"
		};

		const epIn = new Endpoint({
			"name": "epIn",
			"in": true,
			"passive": true
		});
		epIn.step = dummyStep1;

		const epOut = new Endpoint({
			"name": "epOut",
			"out": true,
			"active": true
		});
		epOut.step = dummyStep2;

		const epEvil = new Endpoint({
			"name": "epEvil",
			"out": true,
			"active": true
		});
		epEvil.step = dummyStep1;


		// set the second endpoint as already connected
		epIn.connect(epEvil);

		// connect the endpoints
		expect(function () {
			epOut.connect(epIn);
		}).to.throw("Could not conect the endpoint, the endpoint 'epIn' is already connected with 'epEvil'");

		done();
	});

});
