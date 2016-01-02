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

  connect(otherEndpoint) {
    if (otherEndpoint instanceof ReceiveEndpoint) {
      throw new Error(" could not connect two 'ReceiveEndpoint' together");
    }
    otherEndpoint.connect(this);
  }

  toJSON() {
    return {
      "in": true
    };
  }
}

class SendEndpoint extends cnm.ConnectorMixin(Endpoint) {
  send(request) {
    if (!this.connected) {
      throw new Error(`The endpoint '${this.name}' in the Step '${this.owner.name}' has no connected endpoint`);
    }

    if (!this.connected.receive) {
      throw new Error(
        `The endpoint '${this.connected}' in the Step '${this.connected.owner.name}' has no receive function`);
    }
    return this.connected.receive(request);
  }

  connect(otherEndpoint) {
    if (otherEndpoint instanceof SendEndpoint) {
      throw new Error(" could not connect two 'SendEndpoint' together");
    }
    this.connected = otherEndpoint;
  }

  toJSON() {
    const json = {
      out: true
    };
    if (this.isConnected) json.target = this.connected.name;
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
