/* jslint node: true, esnext: true */

"use strict";

const cnm = require('./connector-mixin');


class Endpoint {
  constructor(name, owner) {
    Object.defineProperty(this, 'name', {
      value: name
    });

    Object.defineProperty(this, 'owner', {
      value: owner
    });
  }

  toString() {
    return `${owner}/${this.name}`;
  }
}

class ReceiveEndpoint extends Endpoint {
  get receive() {
    return this._receive;
  }

  set receive(receive) {
    this._receive = receive;
  }

  toJSON() {
    return {
      "in": true
    };
  }
}

class SendEndpoint extends cnm.ConnectorMixin(Endpoint) {
  send(request) {
    return this.connected.receive(request);
  }

  toJSON() {
    return {
      "out": true
    };
  }
}

exports.Endpoint = Endpoint;
exports.ReceiveEndpoint = ReceiveEndpoint;
exports.SendEndpoint = SendEndpoint;
