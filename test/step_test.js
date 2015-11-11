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
  BaseStep = require('../index').Step,
  testStep = require('kronos-test-step'),
  index = require('../index'),
  scopeDefinitions = require('../lib/scopeDefinitions');

// get a mock manager
const manager = testStep.managerMock;

// defines a new step which will inherit from the base step implementation
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
  initialize(manager, scopeReporter, name, stepConfiguration, endpoints, props) {
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
          //console.log(`SEND: ${sequence}`);
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

    // TODO never reached ?
    props.initializeDone = {
      value: true
    };
  }
};

// Create a factory which could be registered at the manager.
// In this case the outStep will inherit from the base step
const OutStepFactory = Object.assign({}, BaseStep, outStep);

// register the step at the manager
manager.registerStepImplementation(OutStepFactory);


// also a step implementation which will inherit from the Base Step
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

// register the step at the manager
manager.registerStepImplementation(Object.assign({}, BaseStep, stepWithoutInitialize));


// defines another step
const A_Step = {
  name: "myStep",
  type: "out-step",
  description: "my out-step description"
};
const A_StepFactory = Object.assign({}, OutStepFactory, A_Step);


const aStep = A_StepFactory.createInstance(manager, manager.scopeReporter, {
  "name": "myStep2",
  "description": "my out-step description"
});

describe('steps', function () {
  describe('static', function () {
    describe('single step with initialize', function () {
      testStep.checkStepStatic(manager, aStep, function () {
        describe('type', function () {
          it('present', function () {
            // name will become the type
            assert.equal(aStep.type, 'myStep');
          });
        });
        describe('name', function () {
          it('given name present', function () {
            assert.equal(aStep.name, 'myStep2');
          });
          it('toString() is name', function () {
            assert.equal(aStep.toString(), 'myStep2');
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
              "type": "myStep",
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

      const A_Step = {
        name: "myStep",
        type: "step-without-initialize"
      };

      const A_StepFactory2 = Object.assign({}, BaseStep, stepWithoutInitialize, A_Step);
      const aStep = A_StepFactory2.createInstance(manager, manager.scopeReporter, {
        "name": "myNewName",
        "description": "This step is the base class for step implementations"
      });

      testStep.checkStepStatic(manager, aStep, function () {
        describe('type', function () {
          it('present', function () {
            // The name will become the type
            assert.equal(aStep.type, 'myStep');
          });
        });
        describe('name', function () {
          it('given name present', function () {
            assert.equal(aStep.name, 'myNewName');
          });
          it('toString() is name', function () {
            assert.equal(aStep.toString(), 'myNewName');
          });
        });
        describe('json', function () {
          it('toJSON()', function () {
            assert.deepEqual(aStep.toJSON(), {
              "type": "myStep",
              "description": "This step is the base class for step implementations",
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

      const A_Step = {
        type: "out-step",
        name: "myname"
      };

      const A_StepFactory3 = Object.assign({}, OutStepFactory, A_Step);
      const aStep = A_StepFactory3.createInstance(manager, manager.scopeReporter, {});

      const inEp = endpointImplementation.createEndpoint("in", {
        "in": true,
        "passive": true
      });

      let request;

      inEp.setPassiveGenerator(function* () {
        while (true) {
          request = yield;
        }
      });
      aStep.endpoints.out.connect(inEp);

      testStep.checkStepLivecycle(manager, aStep, function (step, state) {
        assert.equal(step.initializeDone, true);

        if (state === 'running' && request) {
          //console.log(`CHECK: ${request.info.name}`);
          assert.match(request.info.name, /request\d+/);
        }
      });

    });
  });
});
