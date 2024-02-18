import { RPCClient } from "./client"
import { Observable, ReplaySubject } from "rxjs"

export default class ClientPubSub {
	constructor(public readonly client: RPCClient) {}

	channelReplaySubjects = new Map<string, ReplaySubject<any>>()

	generateClientId(): string {
		return Math.random().toString(36).substr(2, 10)
	}

	subscribe(channel: string): Observable<any> {
		if (!this.channelReplaySubjects.has(channel)) {
			// TODO this is temporary, we should have a way to unsubscribe from the observable
			const observ = this.client.callFunction("getChannelObservable", channel)
			this.channelReplaySubjects.set(channel, new ReplaySubject<any>(1))
			observ.subscribe((value) => {
				this.channelReplaySubjects.get(channel)?.next(value)
			})
		}
		return this.channelReplaySubjects.get(channel)!.asObservable()
	}

	provideValue(channel: string, value: any) {
		this.client.callFunction("setClientValue", { channel, value })
	}

	publish(channel: string, payload: any) {
		this.client.callFunction("publish", { channel, payload })
	}
}
