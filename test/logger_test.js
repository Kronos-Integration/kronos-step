/* global describe, it*/
/* jslint node: true, esnext: true */

"use strict";


const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const loggingSupport = require('../lib/loggingSupport');

describe('logger', function () {

  const someObject = {
    logLevel: 9999999
  };

  it('methods present', function () {
    let value = 0;

    loggingSupport.assignLoggerFunctions(someObject, function myLogger(args) {
      value = args;
    });

    someObject.info("message");

    assert.equal(value, 'message');
  });
});
