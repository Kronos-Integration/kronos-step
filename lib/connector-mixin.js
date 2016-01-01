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

  inject(endpoint) {
    endpoint.connected = this.connected;
    this.connected = endpoint;
  }
};

exports.ConnectorMixin = ConnectorMixin;
