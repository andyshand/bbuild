import WS from 'isomorphic-ws'
import { Observable, Observer, Subject, finalize, share } from 'rxjs'
type ListenerMap = Map<string, Observer<any> & { hasCompleted: boolean }>

export class RPCClient {
  static clients = new Map<string, RPCClient>()
  private url: string
  private socket: WS
  private listeners: ListenerMap
  private requestCounter: number
  private pendingCalls: { id: string; key: string; payload: any }[]
  private isConnected: boolean

  static getSingleton() {
    return Array.from(RPCClient.clients.values()).filter((c) => !c.url.includes('9050'))[0]
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token)
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  constructor(url: string = 'ws://localhost:9090') {
    this.url = url
    this.listeners = new Map<string, Observer<any> & { hasCompleted: boolean }>()
    this.requestCounter =
      typeof window !== 'undefined'
        ? parseInt(localStorage.getItem('requestCounter') || '0', 10)
        : 0
    this.pendingCalls = []
    this.isConnected = false
    this.connect()
    RPCClient.clients.set(url, this)

    return new Proxy(this, {
      get: (target: RPCClient, key: string) => {
        if (key in target) {
          return target[key]
        }
        return (payload: any) => this.callFunction(key, this.addAuthToPayload(payload))
      },
    })
  }

  private connect() {
    // If we're inside nextjs build, don't connect to the socket
    if (typeof window === 'undefined') {
      return
    }

    console.log(`RPCClient connecting to ${this.url}...`)
    this.socket = new WS(this.url)
    this.socket.onopen = () => {
      this.isConnected = true
      this.sendPendingCalls()
    }
    this.socket.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data.toString())
        if (data) {
          const listener = this.listeners.get(data?.id)
          if (listener) {
            if (data.error) {
              throw new Error(data.error)
            } else {
              if (data.next || (data.complete && !listener.hasCompleted)) {
                // Second condition ensure that observables always has some value, even if undefined.
                // Without this, calls to firstValueFrom() will fail.
                listener.next(data.next)
              }
              if (data.complete) {
                listener.complete()
              }
            }
          }
        }
      } catch (e) {
        const error = new Error(`Error while parsing message: ${message.data.toString()}`, {
          cause: e,
        })
        console.error(error)
      }
    }

    this.socket.onclose = () => {
      this.isConnected = false
      this.listeners.forEach((listener) => listener.error(new Error('Socket closed')))
      // Try to reconnect after a timeout
      setTimeout(() => this.connect(), 1000)
    }
  }

  private sendPendingCalls() {
    while (this.pendingCalls.length > 0) {
      const call = this.pendingCalls.shift()
      this.socket.send(JSON.stringify(call))
    }
  }

  addAuthToPayload(payload: any) {
    if (!payload || typeof payload !== 'object') {
      return payload
    }
    return {
      ...payload,
      auth: {
        token: this.getToken(),
      },
    }
  }

  callFunction(key: string, payload: any): Observable<any> {
    // Create a subject to multicast the values to multiple subscribers
    const subject = new Subject<any>()

    // Use the `share` operator to create a shared Observable
    const sharedObservable = subject.asObservable().pipe(share())

    // Subscribe to the shared Observable to execute the inner logic
    const subscription = sharedObservable.subscribe()

    const id = (++this.requestCounter).toString()
    if (typeof window !== 'undefined') {
      localStorage.setItem('requestCounter', this.requestCounter.toString())
    }
    this.listeners.set(id, {
      next: (value) => subject.next(value),
      error: (err) => subject.error(err),
      complete: () => subject.complete(),
      hasCompleted: false,
    })

    payload = this.addAuthToPayload(payload)

    if (this.isConnected) {
      this.socket.send(JSON.stringify({ id, key, payload }))
    } else {
      this.pendingCalls.push({ id, key, payload })
    }

    // Return the shared Observable
    return sharedObservable.pipe(
      // Unsubscribe and clean up when there are no more subscribers
      finalize(() => {
        this.listeners.delete(id)
        this.socket.send(JSON.stringify({ id, unsubscribe: true }))
        subscription.unsubscribe()
      })
    )
  }

  callPromise(key: string, payload: any): Promise<any> {
    const obs = this.callFunction(key, payload)
    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (value) => resolve(value),
        error: (err) => reject(err),
        complete: () => {},
      })
    })
  }
}

export default RPCClient
