import type { DepFn } from "modules/deps"
import { invariant } from "modules/errors"
import { Observable, interval, of } from "rxjs"
import WebSocket from "ws"

export interface RequestData {
	id: string
	key: string
	payload?: any
	unsubscribe?: boolean
}

export interface ResponseData {
	id: string
	value?: any
	error?: string
}

export type FunctionMap = {
	[key: string]: (payload?: any) => any
}

let server: WebSocket.Server | null = null
const globalFunctions: FunctionMap = {
	echo: (message: string): Observable<string> => {
		console.debug("echo observable created") // Debugging message
		return of(message)
	},
	time: (): Observable<number> => {
		console.debug("time observable created") // Debugging message
		return interval(1000)
	},
}

// If nodejs environment
let asyncHooks: any = null
if (!process.env.CHROME_EXTENSION) {
	asyncHooks = require("async_hooks")
} else {
	asyncHooks = {
		AsyncLocalStorage: class {
			constructor() { }

			getStore() {
				return new Map()
			}
			async run(map, cb) {
				return cb()
			}
		},
	}
}
const context = new asyncHooks.AsyncLocalStorage()
export const getAsyncContext = () => context.getStore() as Map<string, any>

function runInAsyncContext(values: any, fn: any, args: any) {
	return new Promise((resolve, reject) => {
		context.run(new Map(), async () => {
			const store = context.getStore() as Map<string, any>
			for (const [key, value] of Object.entries(values)) {
				store.set(key, value)
			}
			// Set any required store values here
			try {
				const res = await fn(args)
				return resolve(res)
			} catch (e) {
				console.error(e)
				reject(e)
			}
		})
	})
}

let nextId = 0
const defaultPort = 9090
export function startWsServer(
	port = defaultPort,
	opts?: {
		functions?: FunctionMap
	},
) {
	let localFunctions: FunctionMap = opts?.functions ?? {}

	try {
		server = new WebSocket.Server({ port })
		server.on("error", (err) => {
			console.error("Error starting WebSocket server", err)
		})
		server.on("connection", (socket: WebSocket) => {
			console.debug("Connection established") // Debugging message
			const subscriptions = new Map<string, any>()
			const connectionId = String(++nextId);

			const soc = socket as any;
			soc._id = connectionId

			socket.on("message", async (message: WebSocket.Data) => {
				// console.debug(`Received message: ${message}`) // Debugging message
				let data: RequestData
				try {
					data = JSON.parse(message.toString())
				} catch (error) {
					socket.send(JSON.stringify({ error: "Invalid JSON format" }))
					return
				}

				const { id, key, payload, unsubscribe } = data

				if (unsubscribe) {
					const subscription = subscriptions.get(id)
					if (subscription) {
						subscription.unsubscribe()
						subscriptions.delete(id)
					}
					return
				}

				const func = localFunctions[key] ?? globalFunctions[key]
				if (!func) {
					socket.send(
						JSON.stringify({
							id,
							error: `Function '${key}' not found in FunctionMap`,
						}),
					)
					return
				}

				try {
					// console.log("calling function", key, payload)
					const response = await runInAsyncContext(
						{
							connectionId,
						},
						func,
						payload,
					)
					// console.log({response});
					if (response instanceof Observable) {
						// console.debug(`Observable for function '${key}' created`); // Debugging message
						const subscription = response.subscribe(
							(value) => {
								console.debug(`Observable '${key}' value: ${value}`) // Debugging message
								socket.send(JSON.stringify({ id, next: value } as ResponseData))
							},
							(error) => {
								console.error(`Observable '${key}' error: ${error.message}`) // Debugging message
								socket.send(JSON.stringify({ id, error: error.message } as ResponseData))
							},
							() => {
								console.debug(`Observable '${key}' completed`) // Debugging message
								socket.send(JSON.stringify({ id, complete: true } as ResponseData))
								subscriptions.delete(id)
							},
						)
						subscriptions.set(id, subscription)
					} else {
						socket.send(
							JSON.stringify({
								id,
								next: response,
								complete: true,
							} as ResponseData),
						)
					}
				} catch (e) {
					socket.send(
						JSON.stringify({
							id,
							error: e.message,
							complete: true,
						} as ResponseData),
					)
				}
			})

			socket.once("close", () => {
				console.debug("Connection closed. Cleaning subscriptions.") // Debugging message
				subscriptions.forEach((subscription) => subscription.unsubscribe())
			})
		})
		return {
			close: () => {
				if (server) {
					server.close()
					server = null
				}
			},
			on: (key: string, func: any) => {
				console.log("on", key)
				return server?.on(key, func)
			},
			functions: localFunctions,
		}
	} catch (e) {
		console.error("Error starting WebSocket server", e)
		throw e
	}
}
export type WSServer = ReturnType<typeof startWsServer>

export function addWSFunction(...args: [string, any] | [DepFn]) {
	const key = typeof args[0] === "string" ? args[0] : args[0]._name ?? args[0].name
	invariant(!!key, "Function must have a name")
	const func = typeof args[0] === "string" ? args[1] : args[0]

	console.log("addWSFunction", key)
	globalFunctions[key] = func
	return func
}

export default startWsServer
