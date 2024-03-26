import ClientPubSub from '../ClientPubSub'
import RPCClient from '../client'

const getFallback = () => {
  if (typeof window !== 'undefined') {
    // Use same hostname and port as the current page
    const url = new URL(window.location.href)
    return `ws://${url.hostname}:${url.port || 80}`
  }

  // Assume server-side, and no WS_URL means we're in dev mode?
  if (process.env.NODE_ENV !== 'production') {
    // TODO Is this still used? Does server connect to ws on backend?
    return `ws://localhost:3000`
  } else {
    return `ws://0.0.0.0:80`
  }
}

const WS_URL = process.env.WS_URL || getFallback()

const client = new RPCClient(WS_URL + `/ws/central`)
const pubSub = new ClientPubSub(client)

export default client

export { client, pubSub }
