import ClientPubSub from "../ClientPubSub"
import Client from "../client"

const client = new Client("ws://localhost:9050")
const pubSub = new ClientPubSub(client)

export default client

export { pubSub, client }
