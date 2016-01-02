/* jslint node: true, esnext: true */

"use strict";

const ConnectorMixin = (superclass) => class extends superclass {
  set connected(e) {
    this._connected = e;
  }

  get connected() {
    return this._connected;
  }

  get isConnected() {
    return this._connected ? true : false;
  }

  /**
   * delivers the other end of the connection chain
   */
  get otherEnd() {
    let c = this;
    while (c.isConnected) {
      c = c.connected;
    }
    return c;
  }

  inject(endpoint) {
    endpoint.connected = this.connected;
    this.connected = endpoint;
  }
};

exports.ConnectorMixin = ConnectorMixin;
