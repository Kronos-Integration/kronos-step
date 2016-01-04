/* jslint node: true, esnext: true */

"use strict";

/**
 * Mixin to make endpoints connectable
 * Forms a single linked List
 */
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

  /**
   * Injects a endpoint after ourselfs.
   * @param {Endpoint} endpoint to be injected (after ourselfs)
   */
  injectNext(endpoint) {
    endpoint.connected = this.connected;
    this.connected = endpoint;
  }

  /**
   * Removes the next Element from the chain
   */
  removeNext() {
    if (this.isConnected) {
      this.connected = this.connected.connected;
    }
  }
};

exports.ConnectorMixin = ConnectorMixin;
