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

exports.Interceptor = Interceptor;
exports.LoggingInterceptor = LoggingInterceptor;
