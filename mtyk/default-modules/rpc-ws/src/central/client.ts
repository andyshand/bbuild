import ClientPubSub from '../ClientPubSub'
import RPCClient from '../client'

const client = new RPCClient('ws://localhost:9050')
const pubSub = new ClientPubSub(client)

export default client

export { client, pubSub }
