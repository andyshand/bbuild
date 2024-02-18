import Docker from 'dockerode'

// const DOCKER_HOST_ENV = process.env.DOCKER_HOST
// const host = /^tcp:\/\//.test(DOCKER_HOST_ENV)
//   ? DOCKER_HOST_ENV.replace(/^tcp:\/\//, '')
//   : DOCKER_HOST_ENV

// const opts = {
//   host: host?.split(':')[0] ?? 'localhost',
//   port: host?.split(':')[1] || 2375,
// }
// console.log(`Docker configured with ${JSON.stringify(opts)}`)
export const docker = new Docker({
  // version: 'v1.43',
})
