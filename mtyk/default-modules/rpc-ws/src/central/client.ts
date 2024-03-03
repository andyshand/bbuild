import ClientPubSub from '../ClientPubSub'
import RPCClient from '../client'

const getFallback = () => {
  if (typeof window !== 'undefined') {
    // Use same hostname and port as the current page
    const url = new URL(window.location.href)
    const port = url.hostname === 'localhost' ? 8080 : 80
    return `ws://${url.hostname}:${port}`
  }

  // Assume server-side, and no WS_URL means we're in dev mode?
  return 'ws://localhost:8080'
}

const WS_URL = process.env.WS_URL || getFallback()

console.log({ WS_URL })
const client = new RPCClient(WS_URL + `/ws/central`)
const pubSub = new ClientPubSub(client)

export default client

export { client, pubSub }
