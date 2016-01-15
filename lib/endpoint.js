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

class InterceptedEndpoint extends Endpoint {
  get hasInterceptors() {
    return this._firstInterceptor !== undefined;
  }

  get firstInterceptor() {
    return this._firstInterceptor;
  }

  get lastInterceptor() {
    return this._lastInterceptor;
  }

  get interceptors() {
    const itcs = [];
    let i = this.firstInterceptor;
    while (i) {
      itcs.push(i);
      if (i === this.lastInterceptor) break;
      i = i.connected;
    }

    return itcs;
  }

  set interceptors(newInterceptors) {
    if (newInterceptors === undefined || newInterceptors.length === 0) {
      this._firstInterceptor = undefined;
      this._lastInterceptor = undefined;
    } else {
      this._firstInterceptor = newInterceptors[0];
      this._lastInterceptor = newInterceptors.reduce((previous, current) => previous.connected = current,
        this._firstInterceptor);
    }
  }
}

// TODO interceptor forwarding/receive is missing
class ReceiveEndpoint extends InterceptedEndpoint {
  get receive() {
    return this._receive;
  }

  set receive(receive) {
    if (this.hasInterceptors) {
      this._internalEndpoint.receive = receive;
    } else {
      this._receive = receive;
    }
  }

  set interceptors(newInterceptors) {
    const lastReceive = this.hasInterceptors ? this._internalEndpoint.receive : this.receive;

    super.interceptors = newInterceptors;

    if (this.hasInterceptors) {
      if (!this._internalEndpoint) {
        let internalReceive = lastReceive;
        this._internalEndpoint = Object.create(this, {
          'receive': {
            get() {
                return internalReceive;
              },
              set(r) {
                internalReceive = r;
              }
          }
        });
      }

      this.lastInterceptor.connected = this._internalEndpoint;
      this._receive = request => {
        return this.firstInterceptor.receive(request);
      };
    } else {
      this._receive = lastReceive;
    }
  }

  get isIn() {
    return true;
  }
}

class SendEndpoint extends cnm.ConnectorMixin(InterceptedEndpoint) {
  receive(request, formerRequest) {
    return this.connected.receive(request, formerRequest);
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

  set interceptors(newInterceptors) {
    const lastConnected = this.hasInterceptors ? this.lastInterceptor.connected : this._connected;

    super.interceptors = newInterceptors;
    if (this.hasInterceptors) {
      this.lastInterceptor.connected = lastConnected;
      this._connected = this.firstInterceptor;
    } else {
      this._connected = lastConnected;
    }
  }

  set connected(e) {
    if (this.hasInterceptors) {
      this.lastInterceptor.connected = e;
    } else {
      //console.log(`${this.name}: connected = ${e}`);
      super.connected = e;
    }
  }

  // DEPRECATED
  send(request, formerRequest) {
    console.log("deprecated only use receive");
    return this.receive(request, formerRequest);
  }

  // TODO why is this required ?
  get connected() {
      return this._connected;
    }
    // TODO why is this required ?
  get interceptors() {
    return super.interceptors;
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
