
import createRPCServer from '../server'
import pubsub from '../ServerPubSub'

const centralServer = createRPCServer(9050)
const pub = new pubsub(centralServer)

console.log('Central server started')

setInterval(() => {
  pub.publish('time', new Date().toString())
}, 1000)

export default centralServer
export {
  pub as serverPubSub
}