/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  endpoint = require('../lib/endpoint'),
  interceptor = require('../lib/interceptor');

function nameIt(name) {
  return {get name() {
      return name;
    }
  };
}

describe('endpoint', function () {
  describe('connecting', function () {
    const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));
    const ep2 = new endpoint.ReceiveEndpoint('ep2', nameIt('o2'));

    xit('initially not isConnected', function () {
      assert.isFalse(ep1.isConnected);
    });

    ep1.connected = ep2;

    it('isConnected', function () {
      assert.isTrue(ep1.isConnected);
    });
    it('has otherEnd', function () {
      assert.equal(ep1.otherEnd, ep2);
    });

    describe('with interceptor', function () {
      const in1 = new interceptor.Interceptor();
      ep1.inject(in1);

      it('isConnected', function () {
        assert.isTrue(ep1.isConnected);
      });

      it('has otherEnd', function () {
        assert.equal(ep1.otherEnd, ep2);
      });
    });

  });
});
