import createRPCServer from '../server'
import PubSub from '../ServerPubSub'

console.log('Starting central server')

const centralServer = createRPCServer('/ws/central')
const pub = new PubSub(centralServer)

console.log('Central server started')

setInterval(() => {
  pub.publish('time', new Date().toString())
}, 1000)

export default centralServer
export { pub as serverPubSub }
