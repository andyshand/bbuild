import { WebSocket } from 'ws'
import { WebsocketProvider } from 'y-websocket'

import Y from 'yjs'

const YWS = 'ws://localhost:1234'

interface WebsocketProviderOptions {
  WebSocketPolyfill?: typeof WebSocket
}

export function initializeYjsSyncProvider(
  entityId: string,
  yDoc: Y.Doc
): WebsocketProvider {
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
