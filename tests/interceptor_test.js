/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  endpoint = require('../lib/endpoint'),
  interceptor = require('../lib/interceptor');

/* simple owner with name */
function nameIt(name) {
  return {get name() {
      return name;
    }
  };
}

describe('interceptor', function () {
  describe('TimoutInterceptor', function () {
    const i1 = new interceptor.TimeoutInterceptor(10);

    it('prototype has a type', function () {
      assert.equal(interceptor.TimeoutInterceptor.type, "timeout");
    });
    it('has a type', function () {
      assert.equal(i1.type, "timeout");
    });

    i1.connected = new endpoint.ReceiveEndpoint('r1', nameIt('o1'));
    i1.connected.receive = request => {
      return new Promise((fullfilled, rejected) => {
        setTimeout(() => {
          fullfilled(request);
        }, 10);
      })
    };

    it('long running timout request', function (done) {
      let response = i1.receive("request", 5);
      response.then(resolved => {
        console.log(`resolved ${resolved}`);
      }).catch(rejected => {
        console.log(`got timeout ? ${rejected}`);
        done();
      });
    });

    it('passing timout request', function (done) {
      let response = i1.receive("request", 100);
      response.then(resolved => {
        console.log(`resolved ${resolved}`);
      }).catch(rejected => {
        console.log(`got timeout ? ${rejected}`);
        done();
      });
    });

  });
});
