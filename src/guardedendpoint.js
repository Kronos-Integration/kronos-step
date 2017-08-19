import { ReceiveEndpoint, SendEndpoint } from 'kronos-endpoint';

export class GuardedReceiveEndpoint extends ReceiveEndpoint {
  /**
   * connect two endpoints
   */
  connect(otherEndpoint) {
    if (otherEndpoint instanceof ReceiveEndpoint) {
      throw new Error("Could not connect two 'ReceiveEndpoint's together");
    }
    otherEndpoint.connected = this;
  }
}

export class GuardedSendEndpoint extends SendEndpoint {
  receive(request, formerRequest) {
    if (!this.isConnected) {
      throw new Error(
        `The endpoint '${this.name}' in the Step '${this.owner
          .name}' has no connected endpoint`
      );
    }

    if (!this.connected.receive) {
      throw new Error(
        `The endpoint '${this.connected}' in the Step '${this.connected.owner
          .name}' has no receive function`
      );
    }
    return this.connected.receive(request, formerRequest);
  }

  /**
   * connect two endpoints
   */
  connect(otherEndpoint) {
    if (otherEndpoint instanceof SendEndpoint) {
      throw new Error("Could not connect two 'SendEndpoint' together");
    }
    this.connected = otherEndpoint;
  }
}
