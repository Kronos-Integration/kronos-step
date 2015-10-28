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

var stepImplementations = {};
const manager = Object.create(new events.EventEmitter(), {
  steps: {
    value: stepImplementations
  }
});

manager.registerStepImplementation = function (si) {
  const psi = index.prepareStepForRegistration(manager, sr, si);
  stepImplementations[psi.name] = psi;
};

const outStep = {
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

    props._stop = {
      value: function () {
        clearInterval(interval);
        return Promise.resolve(this);
      }
    };

    props._start = {
      value: function () {
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
      }
    };
  }
};

const stepWithoutInitialize = {
  "extends": "out-step",
  "name": "step-without-initialize",
  "description": "test step without initialize only",
  "endpoints": {
    "in": {
      "in": true,
      "passive": true
    }
  }
};

manager.registerStepImplementation(outStep);
manager.registerStepImplementation(stepWithoutInitialize);

const aStep = index.createStep(manager, sr, {
  name: "myStep",
  type: "out-step",
  description: "my out-step description"
});


describe('steps', function () {
  describe('static', function () {
    describe('single step with initialize', function () {
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
        });
        describe('description', function () {
          it('present', function () {
            assert.equal(aStep.description, 'my out-step description');
          });
        });

        describe('json', function () {
          it('toJSON()', function () {
            assert.deepEqual(aStep.toJSON(), {
              "type": "out-step",
              "description": "my out-step description",
              "endpoints": {
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
    describe('single step without initialize', function () {

      let aStep = index.createStep(manager, sr, {
        name: "myStep",
        type: "step-without-initialize"
      });

      testStep.checkStepStatic(manager, aStep, function () {
        describe('type', function () {
          it('present', function () {
            assert.equal(aStep.type, 'step-without-initialize');
          });
        });
        describe('name', function () {
          it('given name present', function () {
            assert.equal(aStep.name, 'myStep');
          });
          it('toString() is name', function () {
            assert.equal(aStep.toString(), 'myStep');
          });
        });
        describe('json', function () {
          it('toJSON()', function () {
            assert.deepEqual(aStep.toJSON(), {
              "type": "step-without-initialize",
              "endpoints": {
                "in": {
                  "in": true,
                  "passive": true
                }
              }
            });
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
