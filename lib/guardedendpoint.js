/* jslint node: true, esnext: true */

"use strict";

const endpoint = require('kronos-endpoint');

class GuardedReceiveEndpoint extends endpoint.ReceiveEndpoint {

  /**
   * connect two endpoints
   */
  connect(otherEndpoint) {
    if (otherEndpoint instanceof endpoint.ReceiveEndpoint) {
      throw new Error("Could not connect two 'ReceiveEndpoint' together");
    }
    otherEndpoint.connected = this;
  }
}

class GuardedSendEndpoint extends endpoint.SendEndpoint {
  receive(request, formerRequest) {
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
   * connect two endpoints
   */
  connect(otherEndpoint) {
    if (otherEndpoint instanceof endpoint.SendEndpoint) {
      throw new Error("Could not connect two 'SendEndpoint' together");
    }
    this.connected = otherEndpoint;
  }
}


exports.GuardedReceiveEndpoint = GuardedReceiveEndpoint;
exports.GuardedSendEndpoint = GuardedSendEndpoint;
