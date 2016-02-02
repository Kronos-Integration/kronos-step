/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  events = require('events'),
  endpoint = require('kronos-endpoint'),
  index = require('../index'),
  BaseStep = index.Step,
  testStep = require('kronos-test-step');

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
  initialize(manager, name, stepConfiguration, props) {
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
          this.endpoints.out.receive({
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

const manager = {};

// Create a factory which could be registered at the manager.
// In this case the outStep will inherit from the base step
const OutStepFactory = Object.assign({}, BaseStep, outStep);

// register the step at the manager
//manager.registerStepImplementation(OutStepFactory);


// defines another step
const A_Step = {
  name: "myStep",
  type: "out-step",
  description: "my out-step description"
};
const A_StepFactory = Object.assign({}, OutStepFactory, A_Step);


const aStep = A_StepFactory.createInstance({
  "name": "myStep2",
  "description": "my out-step description"
}, manager);

describe('logger', () => {
  it('Error as Error Object', done => {
    const aStep = A_StepFactory.createInstance({
      "name": "myStep2",
      "description": "my out-step description"
    }, manager);

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
        'step-type': 'myStep',
        'step-name': 'myStep2',
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

  it('Error as String', done => {

    const aStep = A_StepFactory.createInstance({
      "name": "myStep2",
      "description": "my out-step description"
    }, manager);

    // consumes the log events
    const inEp = new endpoint.ReceiveEndpoint("in");

    inEp.receive = request => {
      // set the timestamp to a constant
      request.timestamp = 1451333332866;

      assert.deepEqual(request, {
        "timestamp": 1451333332866,
        "level": 'error',
        'step-type': 'myStep',
        'step-name': 'myStep2',
        "message": 'Gumbo'
      });
      done();
    };

    aStep.endpoints.log.connected = inEp;
    aStep.error("Gumbo");
  });

  it('Error as object', done => {

    const aStep = A_StepFactory.createInstance({
      "name": "myStep2",
      "description": "my out-step description"
    }, manager);

    // consumes the log events
    const inEp = new endpoint.ReceiveEndpoint("in");

    inEp.receive = request => {
      // set the timestamp to a constant
      request.timestamp = 1451333332866;

      assert.deepEqual(request, {
        "timestamp": 1451333332866,
        "level": 'error',
        'step-type': 'myStep',
        'step-name': 'myStep2',
        "short_message": 'Gumbo',
        "Other": "What ever"
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
