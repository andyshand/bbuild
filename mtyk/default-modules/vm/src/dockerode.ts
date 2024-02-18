import os from 'os'
import { MTYKContainer } from './MTYKContainer'
import { docker } from './docker'
import { em } from './em'

interface DockerOptions {
  imageName: string
  projectDir: string
  ports: number[]
  command?: string[]
  volumes?: Record<string, any>
  binds?: string[]
}

export async function createContainer(options: DockerOptions): Promise<MTYKContainer> {
  const portBindings = options.ports.reduce((acc: any, port: number) => {
    acc[port + '/tcp'] = [{ HostPort: `${port}`, HostIp: '0.0.0.0' }]
    return acc
  }, {})

  const exposedPorts = options.ports.reduce((acc: any, port: number) => {
    acc[port + '/tcp'] = {}
    return acc
  }, {})

  // Ensure image is pulled
  // await docker.pull(options.imageName)

  const container = await docker.createContainer({
    Image: options.imageName,
    Cmd: options.command,
    Volumes: {
      ...(options.volumes ?? {}),
      '/app': {},
    },
    ExposedPorts: exposedPorts,
    HostConfig: {
      Binds: [`${options.projectDir}:/app`, ...(options.binds ?? [])],
      PortBindings: portBindings,
    },
    platform: os.arch() === 'arm64' ? 'linux/arm64' : 'linux/amd64',
    Labels: {
      'created.by': 'mtyk',
    },
  })

  const created = await em.create(MTYKContainer, {
    dockerodeContainer: container,
  })
  return created
}

export async function _removeAllMTYK() {
  const containers = await docker.listContainers()
  console.log('Removing all MTYK containers')
  const mtykContainers = containers.filter((c) => c.Labels['created.by'] === 'mtyk')
  await Promise.all(
    mtykContainers.map(async (c) => {
      const container = docker.getContainer(c.Id)
      const containerInfo = await container.inspect()
      if (containerInfo.State.Running) {
        console.log('Stopping container', c.Id)
        await container.stop()
      }
      await container.remove()
      console.log('Removed container', c.Id)
    }),
  )
}

setTimeout(() => {
  _removeAllMTYK()
}, 1000)
