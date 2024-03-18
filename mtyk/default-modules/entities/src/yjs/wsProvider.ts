import { RPC_DEFAULT_PORT } from 'modules/rpc-ws/config'
import { WebSocket } from 'ws'
import { WebsocketProvider } from 'y-websocket'

import Y from 'yjs'

const hostname =
  typeof window === 'undefined' ? 'localhost' : new URL(window.location.href).hostname
const port = typeof window !== 'undefined' && hostname !== 'localhost' ? 80 : RPC_DEFAULT_PORT

const protocol =
  typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
const YWS = `${protocol}://${hostname}:${port}/ws/yjs`
console.log({ YWS, hostname, port, protocol })

interface WebsocketProviderOptions {
  WebSocketPolyfill?: typeof WebSocket
}

export function initializeYjsSyncProvider(entityId: string, yDoc: Y.Doc): WebsocketProvider {
  let wsProviderOptions: WebsocketProviderOptions = {}

  if (typeof window === 'undefined') {
    wsProviderOptions.WebSocketPolyfill = WebSocket
  }

  const wsProvider = new WebsocketProvider(
    YWS,
    entityId,
    yDoc,
    //@ts-ignore
    wsProviderOptions
  )

  return wsProvider
}
