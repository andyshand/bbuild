import { WebSocket } from 'ws'
import { WebsocketProvider } from 'y-websocket'

import Y from 'yjs'

const hostname =
  typeof window === 'undefined' ? 'localhost' : new URL(window.location.href).hostname
const port = (typeof window !== 'undefined' ? new URL(window.location.href).port : null) ?? 80
const protocol =
  typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
const YWS = `${protocol}://${hostname}:${port}/ws/yjs`

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
