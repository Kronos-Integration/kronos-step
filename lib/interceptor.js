/* jslint node: true, esnext: true */

"use strict";

const cnm = require('./connector-mixin');

class _DummyInterceptor {}
class Interceptor extends cnm.ConnectorMixin(_DummyInterceptor) {}

class LoggingInterceptor extends Interceptor {
  receive(request) {
    const start = new Date();
    const response = this.connected.receive(request);
    return response.then(f => {
      const now = new Date();
      console.log(`took ${now - start} ms for ${request}`);
      return f;
    });
  }
}



/**
 *
 */
function rejectUnlessResolvedWithin(promise, timeout, name) {
  if (timeout === 0) return promise;

  return new Promise(function (fullfill, reject) {
    const th = setTimeout(() => reject(new Error(`${name} not resolved within ${timeout}ms`)), timeout);

    return promise.then(fullfilled => {
      clearTimeout(th);
      fullfill(fullfilled);
    }, rejected => {
      clearTimeout(th);
      reject(rejected);
    });
  });
}

/**
 * Rejects a request if it does not resolve in a given time
 */
class TimeoutInterceptor extends Interceptor {
  constructor(timeout) {
    super();
    Object.defineProperty(this, 'timeout', {
      value: timeout
    });
  }

  receive(request) {
    return rejectUnlessResolvedWithin(this.connected.receive(request), this.timeout, "-unknown-");
  }
}

/**
 *
 */
class RequestLimitingInterceptor extends Interceptor {
  constructor(limit) {
    super();
    Object.defineProperty(this, 'limit', {
      value: limit
    });

    this.ongoingResponses = new Set();
  }

  receive(request) {
    if (ongoingResponses.size >= this.limit) {
      return Promise.reject(new Error(`Limit of ongoing requests ${limit} reached`));
    }

    let response = this.connected.receive(request);

    const currentResponse = response.then(resolved => {
      this.ongoingResponses.delete(currentResponse);
      return resolved;
    }).catch(rejected => {
      this.ongoingResponses.delete(currentResponse);
      return rejected;
    });

    this.ongoingResponses.add(currentResponse);

    return currentResponse;
  }
}


exports.Interceptor = Interceptor;
exports.LoggingInterceptor = LoggingInterceptor;
exports.TimeoutInterceptor = TimeoutInterceptor;
exports.RequestLimitingInterceptor = RequestLimitingInterceptor;
