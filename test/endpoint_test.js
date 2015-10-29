/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const fs = require('fs');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const endpointImpl = require('../lib/endpoint');

const manager = {};

describe('endpoint', function () {
	describe('definition', function () {
		const metaEndpoint = endpointImpl.createEndpoint('special', {
			"direction": "inout(active,passive)",
			"description": "special name",
			"in": true,
			"out": true,
			"active": true,
			"passive": true,
			"uti": "UTI of the special"
		});

		describe('description', function () {
			it('given description present', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					description: "aDescription"
				});
				assert.equal(endpoint.description, 'aDescription');
			});
			it('without description', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {});
				assert.isUndefined(endpoint.description);
			});

			it('immutable description', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					description: "aDescription"
				});
				try {
					endpoint.description = "new description";
				} catch (e) {}

				assert.equal(endpoint.description, 'aDescription');
			});
		});

		describe('name', function () {
			it('given name present', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {});
				assert.equal(endpoint.name, 'e1');
			});
			it('toString() is name', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {});
				assert.equal(endpoint.toString(), 'e1');
			});

			it('immutable name', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {});
				try {
					endpoint.name = "new name";
				} catch (e) {}

				assert.equal(endpoint.name, 'e1');
			});
		});

		describe('attributes from meta', function () {
			it('name present', function () {
				const endpoint = endpointImpl.createEndpoint('e1', metaEndpoint);
				assert.equal(endpoint.description, 'special name');
			});
		});

		describe('UTI', function () {
			it('given UTI present', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"uti": "public.database"
				});
				assert.equal(endpoint.uti, 'public.database');
			});
		});

		describe('mandatority', function () {
			it('given mandatority present', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"mandatory": false
				});
				assert.isFalse(endpoint.mandatory);
			});
		});

		describe('with target', function () {
			describe('as object', function () {
				it('target present', function () {
					const endpoint = endpointImpl.createEndpoint('e1', {
						target: "myTarget"
					});
					assert.equal(endpoint.target, 'myTarget');
				});
			});

			describe('from connect', function () {
				it('target present', function () {
					const endpoint = endpointImpl.createEndpoint('e1', {
						target: "s2_1/in"
					});
					assert.equal(endpoint.target, 's2_1/in');
				});
			});

			describe('as direct string', function () {
				it('target present', function () {
					const endpoint = endpointImpl.createEndpoint('e1', "myTarget");
					assert.equal(endpoint.target, 'myTarget');
				});
			});
		});

		describe('should have correct direction', function () {
			const name1 = 'in';
			it(`for ${name1}`, function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"in": true
				});
				assert.isTrue(endpoint.in, "in");
				assert.isFalse(endpoint.active, "!active");
				assert.isFalse(endpoint.out, "!out");
			});

			const name2 = "in(active)";
			it(`for ${name2}`, function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"in": true,
					"active": true
				});
				assert.isTrue(endpoint.active, "active");
				assert.isFalse(endpoint.passive, "!passive");
				assert.isTrue(endpoint.in, "in");
				assert.isFalse(endpoint.out, "!out");
			});

			const name3 = "in(passive)";
			it(`for ${name3}`, function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"in": true,
					"passive": true
				});
				assert.isFalse(endpoint.active, "!active");
				assert.isTrue(endpoint.passive, "passive");
				assert.isTrue(endpoint.in, "in");
				assert.isFalse(endpoint.out, "!out");
			});

			const name4 = "in(active,passive)";
			it(`for ${name4}`, function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"in": true,
					"active": true,
					"passive": true
				});
				assert.isTrue(endpoint.in, "in");
				assert.isTrue(endpoint.active);
				assert.isTrue(endpoint.passive);
				assert.isFalse(endpoint.out, "!out");
			});

			const name5 = "out";
			it(`for ${name5}`, function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"out": true,
				});
				assert.isTrue(endpoint.out, "out when out");

				assert.isFalse(endpoint.active);
				assert.isFalse(endpoint.passive);
			});

			const name6 = "in(active),out(passive)";
			it(`for ${name6}`, function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"in": true,
					"out": true,
					"active": true,
					"passive": true
				});
				assert.isTrue(endpoint.out, "out when inout");
				assert.isTrue(endpoint.in, "in when inout");

				assert.isTrue(endpoint.active);
				assert.isTrue(endpoint.passive);
			});

			it('also with meta object', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					target: 'special:/tmp/a',
					"out": true,
					"in": false
				}, metaEndpoint);

				assert.isTrue(endpoint.out, "out when out");
				assert.isFalse(endpoint.in, "!in");
			});
		});

		describe('json', function () {
			it('some attrs', function () {
				const endpoint = endpointImpl.createEndpoint('e1', {
					"out": true,
					"in": true,
					description: "desc",
					target: "sx/out"
				});
				assert.deepEqual(endpoint.toJSON(), {
					"description": "desc",
					"out": true,
					"in": true,
					"target": "sx/out"
				});
			});
		});
	});

	describe("connect", function () {
		it('Connect two endpoints with each other: in with out', function (done) {
			let dummyStep1 = {
				"name": "dumyStepName_1"
			};
			let dummyStep2 = {
				"name": "dumyStepName_2"
			};

			const epIn = endpointImpl.createEndpoint("epIn", {
				"in": true,
				"passive": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"out": true,
				"active": true
			});
			epOut.step = dummyStep2;

			// connect the endpoints
			epIn.connect(epOut);

			const msg = {
				"name": "test1"
			};

			epIn.setPassiveGenerator(function* () {
				while (true) {
					const message = yield;
					assert.equal(message, msg);
					done();
				}
			});

			epOut.send(msg);
		});

		it('Connect two endpoints with each other: out with in', function (done) {
			let dummyStep1 = {
				"name": "dumyStepName_1"
			};
			let dummyStep2 = {
				"name": "dumyStepName_2"
			};

			const epIn = endpointImpl.createEndpoint("epIn", {
				"in": true,
				"passive": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"out": true,
				"active": true
			});
			epOut.step = dummyStep2;

			// connect the endpoints
			epOut.connect(epIn);
			epIn.connect(epOut); // The same endpooints my be conneced as often as you want

			const msg = {
				"name": "test1"
			};

			epIn.setPassiveGenerator(function* () {
				while (true) {
					const message = yield;
					assert.equal(message, msg);
					done();
				}
			});

			epOut.send(msg);
		});

		it('Error: Connect two endpoints with each other: out with out', function (done) {
			let dummyStep1 = {
				"name": "dumyStepName_1"
			};
			let dummyStep2 = {
				"name": "dumyStepName_2"
			};

			const epIn = endpointImpl.createEndpoint("epIn", {
				"out": true,
				"passive": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"out": true,
				"active": true
			});
			epOut.step = dummyStep2;

			// connect the endpoints
			expect(function () {
				epOut.connect(epIn);
			}).to.throw("Could not connect the endpoint 'epOut' with the endpoint 'epIn'");

			done();
		});

		it('Error: Connect two endpoints with each other: in with in', function (done) {
			let dummyStep1 = {
				"name": "dumyStepName_1"
			};
			let dummyStep2 = {
				"name": "dumyStepName_2"
			};

			const epIn = endpointImpl.createEndpoint("epIn", {
				"in": true,
				"passive": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"in": true,
				"active": true
			});
			epOut.step = dummyStep2;

			// connect the endpoints
			expect(function () {
				epOut.connect(epIn);
			}).to.throw("Could not connect the endpoint 'epOut' with the endpoint 'epIn'");

			done();
		});

		it('Error: Connect two endpoints with each other: in:active with out:active', function (done) {
			let dummyStep1 = {
				"name": "dumyStepName_1"
			};
			let dummyStep2 = {
				"name": "dumyStepName_2"
			};

			const epIn = endpointImpl.createEndpoint("epIn", {
				"in": true,
				"active": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"out": true,
				"active": true
			});
			epOut.step = dummyStep2;

			// connect the endpoints
			expect(function () {
				epOut.connect(epIn);
			}).to.throw("Could not connect the endpoint 'epOut' with the endpoint 'epIn'");

			done();
		});

		it('Error: Connect two endpoints with each other: in:passive with out:passive', function (done) {
			let dummyStep1 = {
				"name": "dumyStepName_1"
			};
			let dummyStep2 = {
				"name": "dumyStepName_2"
			};

			const epIn = endpointImpl.createEndpoint("epIn", {
				"in": true,
				"passive": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"out": true,
				"passive": true
			});
			epOut.step = dummyStep2;

			// connect the endpoints
			expect(function () {
				epOut.connect(epIn);
			}).to.throw("Could not connect the endpoint 'epOut' with the endpoint 'epIn'");

			done();
		});


		it('Error: Connect two endpoints with each other: One of them is already connected', function (done) {
			let dummyStep1 = {
				"name": "dumyStepName_1"
			};
			let dummyStep2 = {
				"name": "dumyStepName_2"
			};

			const epIn = endpointImpl.createEndpoint("epIn", {
				"in": true,
				"passive": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"out": true,
				"active": true
			});
			epOut.step = dummyStep2;

			const epEvil = endpointImpl.createEndpoint("epEvil", {
				"in": true,
				"passive": true
			});
			epEvil.step = dummyStep1;


			// set the second endpoint as already connected
			epOut.connect(epEvil);

			// connect the endpoints
			expect(function () {
				epOut.connect(epIn);
			}).to.throw("Could not connect the endpoint, the endpoint 'epOut' is already connected with 'epEvil'");

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

			const epIn = endpointImpl.createEndpoint("epIn", {
				"in": true,
				"passive": true
			});
			epIn.step = dummyStep1;

			const epOut = endpointImpl.createEndpoint("epOut", {
				"out": true,
				"active": true
			});
			epOut.step = dummyStep2;

			const epEvil = endpointImpl.createEndpoint("epEvil", {
				"out": true,
				"active": true
			});
			epEvil.step = dummyStep1;


			// set the second endpoint as already connected
			epIn.connect(epEvil);

			// connect the endpoints
			expect(function () {
				epOut.connect(epIn);
			}).to.throw("Could not connect the endpoint, the endpoint 'epIn' is already connected with 'epEvil'");

			done();
		});
	});

	describe('send & receive', function () {
		const inep = endpointImpl.createEndpoint('in', {
			"in": true,
			"passive": true
		});
		const outep = endpointImpl.createEndpoint('out', {
			"out": true,
			"active": true
		});

		outep.connect(inep);

		it('receive', function (done) {
			inep.receive(function* () {
				let request = yield;
				assert.equal(request, "request1");

				request = yield;
				assert.equal(request, "request2");

				done();
			});

			outep.send("request1");
			outep.send("request2");
		});
	});
});
