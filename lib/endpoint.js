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

  get isDefault() {
    return false;
  }

  toString() {
    return `${this.owner}/${this.name}`;
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
    const json = {
      out: true
    };
    if (this.isConnected) jsoin.target = this.connected.name;
    return json;
  }
}

class SendEndpointDefault extends SendEndpoint {
  get isDefault() {
    return true;
  }
}



exports.Endpoint = Endpoint;
exports.ReceiveEndpoint = ReceiveEndpoint;
exports.SendEndpoint = SendEndpoint;
exports.SendEndpointDefault = SendEndpointDefault;
