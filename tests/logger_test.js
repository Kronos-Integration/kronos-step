/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  scopeReporter = require('scope-reporter'),
  events = require('events'),
  endpoint = require('../lib/endpoint'),
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
      "in": true
    },
    "out": {
      "out": true
    }
  },
  initialize(manager, scopeReporter, name, stepConfiguration, props) {
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
          this.endpoints.out.send({
            info: {
              name: "request" + sequence
            },
            stream: sequence
          });
        }, 5);

        return new Promise(
          (resolve, reject) => {
            setTimeout(() => resolve(this), 200);
          });
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

describe('logger', function () {
  it('Error as Error Object', function (done) {

    const aStep = A_StepFactory.createInstance(manager, manager.scopeReporter, {
      "name": "myStep2",
      "description": "my out-step description"
    });

    // consumes the log events
    const inEp = new endpoint.ReceiveEndpoint("in");

    // the log request
    let request;

    inEp.receive = request => {
      // set the timestamp to a constant
      request.timestamp = 1451333332866;
      request.line = 152;

      assert.deepEqual(request, {
        "timestamp": 1451333332866,
        "level": 'error',
        '_step-type': 'myStep',
        '_step-name': 'myStep2',
        "line": 152,
        //      "_file_name": '/Users/torstenlink/Documents/entwicklung/kronos/kronos-step/test/logger_test.js',
        "_error_name": 'Error',
        "short_message": 'Gumbo'
      });
      done();
    };

    aStep.endpoints.log.connected = inEp;
    aStep.error(new Error("Gumbo"));
  });

  it('Error as String', function (done) {

    const aStep = A_StepFactory.createInstance(manager, manager.scopeReporter, {
      "name": "myStep2",
      "description": "my out-step description"
    });

    // consumes the log events
    const inEp = new endpoint.ReceiveEndpoint("in");

    inEp.receive = request => {
      // set the timestamp to a constant
      request.timestamp = 1451333332866;

      assert.deepEqual(request, {
        "timestamp": 1451333332866,
        "level": 'error',
        '_step-type': 'myStep',
        '_step-name': 'myStep2',
        "short_message": 'Gumbo'
      });
      done();
    };

    aStep.endpoints.log.connected = inEp;
    aStep.error("Gumbo");
  });

  it('Error as object', function (done) {

    const aStep = A_StepFactory.createInstance(manager, manager.scopeReporter, {
      "name": "myStep2",
      "description": "my out-step description"
    });

    // consumes the log events
    const inEp = new endpoint.ReceiveEndpoint("in");


    inEp.receive = request => {
      // set the timestamp to a constant
      request.timestamp = 1451333332866;

      assert.deepEqual(request, {
        "timestamp": 1451333332866,
        "level": 'error',
        '_step-type': 'myStep',
        '_step-name': 'myStep2',
        "short_message": 'Gumbo',
        "_Other": "What ever"
      });
      done();
    };

    aStep.endpoints.log.connected = inEp;
    aStep.error({
      "short_message": "Gumbo",
      "Other": "What ever"
    });
  });
});
