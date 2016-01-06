/* jslint node: true, esnext: true */

"use strict";

const cnm = require('kronos-interceptor');


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

  get isIn() {
    return false;
  }

  get isOut() {
    return false;
  }

  toJSON() {
    const json = {};

    if (this.isIn) json.in = true;
    if (this.isOut) json.out = true;

    return json;
  }
}

class ReceiveEndpoint extends Endpoint {
  get receive() {
    return this._receive;
  }

  set receive(receive) {
    this._receive = receive;
  }

  /**
   * @deprectated
   */
  connect(otherEndpoint) {
    console.log("*** DEPRECATED *** do not use ReceiveEndpoint.connect() use connected property instead");

    if (otherEndpoint instanceof ReceiveEndpoint) {
      throw new Error("Could not connect two 'ReceiveEndpoint' together");
    }
    otherEndpoint.connect(this);
  }

  get isIn() {
    return true;
  }
}

class SendEndpoint extends cnm.ConnectorMixin(Endpoint) {
  send(request, formerRequest) {
    if (!this.isConnected) {
      throw new Error(`The endpoint '${this.name}' in the Step '${this.owner.name}' has no connected endpoint`);
    }

    if (!this.connected.receive) {
      throw new Error(
        `The endpoint '${this.connected}' in the Step '${this.connected.owner.name}' has no receive function`);
    }
    return this.connected.receive(request, formerRequest);
  }

  /**
   * @deprectated
   */
  connect(otherEndpoint) {
    console.log("*** DEPRECATED *** do not use SendEndpoint.connect() use connected property instead");

    if (otherEndpoint instanceof SendEndpoint) {
      throw new Error("Could not connect two 'SendEndpoint' together");
    }
    this.connected = otherEndpoint;
  }

  toJSON() {
    const json = super.toJSON();

    if (this.isConnected) {
      const o = this.otherEnd();
      json.target = `${o.owner.name}/${o.name}`;
    }

    return json;
  }

  get isOut() {
    return true;
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
