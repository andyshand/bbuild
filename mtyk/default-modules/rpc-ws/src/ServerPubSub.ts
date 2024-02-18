import { BehaviorSubject, Observable } from "rxjs";
import type WebSocket from "ws";
import { WSServer, getAsyncContext } from "./server";

export default class ServerPubSub {
  private channels: Map<string, BehaviorSubject<any>>;
  private clientChannels: Map<string, Map<string, any>>;

  constructor(public readonly server: WSServer) {
    this.channels = new Map<string, BehaviorSubject<any>>();
    this.clientChannels = new Map<string, Map<string, any>>();

    this.server.functions['getChannelObservable'] = (channel: string) => this.getChannelObservable(channel);
    this.server.functions['publish'] = (data: { channel: string; payload: any }) => this.publish(data.channel, data.payload);
    this.server.functions['setClientValue'] = (data: {channel: string, value: any}) => this.setClientValue(data.channel, data.value);
    this.server.functions['clearClientValue'] = (channel: string) => this.clearClientValue(channel);

    this.server.on("connection", (socket: WebSocket) => {
      socket.once("close", () => {
        // When the client disconnects, remove its values from the pool
        for (const channel of this.clientChannels.keys()) {
          this.clearClientValue(channel, (socket as any)._id);
        }
      });
    });
  }

  /**
   * @internal
   */
  _updateChannelValue(channel: string) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new BehaviorSubject(undefined));
    }
    const values = Array.from(this.clientChannels.get(channel)!.values());
    this.channels.get(channel)!.next(values);
  }

  getChannelObservable(channel: string): Observable<any> {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new BehaviorSubject(undefined));
      if (!this.clientChannels.has(channel)){
        this.clientChannels.set(channel, new Map<string, any>());
      }
    }
    return this.channels.get(channel)!.asObservable();
  }

  setClientValue(channel: string, value: any) {
    const connectionid = getAsyncContext().get("connectionId");
    if (!this.clientChannels.has(channel)){
      this.clientChannels.set(channel, new Map<string, any>());
    }
    this.clientChannels.get(channel)!.set(connectionid, value);
    this._updateChannelValue(channel);
  }


  clearClientValue(channel: string ,connectionId: string = getAsyncContext().get("connectionId")) {
    this.clientChannels.get(channel)!.delete(connectionId);
    this._updateChannelValue(channel);
  }

  publish(channel: string, payload: any) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new BehaviorSubject(payload));
    } else {
      this.channels.get(channel)!.next(payload);
    }
  }
}
