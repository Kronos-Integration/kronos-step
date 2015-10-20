/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  scopeReporter = require('scope-reporter'),
  events = require('events'),

  endpointImplementation = require('../lib/endpoint'),
  Step = require('../lib/step'),
  testStep = require('kronos-test-step'),
  index = require('../index'),
  scopeDefinitions = require('../lib/scopeDefinitions');

var scopeReports = [];

const sr = scopeReporter.createReporter(scopeDefinitions, function (reporter) {
  scopeReports.push(reporter.toJSON());
});

var receivedRequests = [];

const manager = Object.create(new events.EventEmitter(), {});

const outStep = {
  "extends": Step,
  "name": "out-step",
  "description": "test step only",
  "endpoints": {
    "in": {
      "in": true,
      "passive": true
    },
    "out": {
      "out": true,
      "active": true
    }
  },
  _initialize(manager, scopeReporter, name, stepConfiguration, endpoints, props) {
    let sequence = 0;
    let interval;

    this._stop = function () {
      clearInterval(interval);
      return Promise.resolve(this);
    };

    this._start = function () {
      setInterval(() => {
        sequence = sequence + 1;
        console.log(`SEND: ${sequence}`);
        endpoints.out.send({
          info: {
            name: "request" + sequence
          },
          stream: sequence
        });
      }, 5);
      return Promise.resolve(this);
    };
  }
};

manager.steps = {
  "out-step": index.prepareStepForRegistration(manager, sr, outStep)
};

const aStep = index.createStep(manager, sr, {
  name: "myStep",
  type: "out-step"
});


describe('steps', function () {
  describe('static', function () {
    describe('single step', function () {
      testStep.checkStepStatic(manager, aStep, function () {
        describe('type', function () {
          it('present', function () {
            assert.equal(aStep.type, 'out-step');
          });
        });
        describe('name', function () {
          it('given name present', function () {
            assert.equal(aStep.name, 'myStep');
          });
          it('toString() is name', function () {
            assert.equal(aStep.toString(), 'myStep');
          });
          it('toJSON()', function () {
            assert.deepEqual(aStep.toJSON(), {
              type: "out-step",
              state: "stopped",
              endpoints: {
                "log": {}, // TODO
                "in": {
                  "in": true,
                  "passive": true
                },
                "out": {
                  "active": true,
                  "out": true
                }
              }
            });
          });
        });
      });
    });

    describe('livecycle', function () {
      describe('single step', function () {
        const aStep = index.createStep(manager, sr, {
          type: "out-step"
        }, "myname");

        const inEp = endpointImplementation.createEndpoint("in", {
          "in": true,
          "passive": true
        });

        let request;

        inEp.setPassiveGenerator(function* () {
          while (true) {
            request = yield;
            console.log(`RECEIVE REQUEST: ${request.info.name}`);
          }
        });
        aStep.endpoints.out.connect(inEp);

        testStep.checkStepLivecycle(manager, aStep, function (step, state) {
          if (state === 'running') {
            console.log("CHECK");
            //assert.isAbove(request.stream, 2);
          }
        });
      });
    });
  });
});
