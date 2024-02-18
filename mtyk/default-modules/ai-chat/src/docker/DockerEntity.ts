import { depFn, keyDep } from 'modules/deps'
import { Entity, EntityField, EntityFunction } from 'modules/entities'

const usedPorts = new Set<number>()

function findUnusedPort() {
  const start = 5001
  const end = 6000
  for (let i = start; i < end; i++) {
    if (!usedPorts.has(i)) {
      usedPorts.add(i)
      return i
    }
  }
  throw new Error(`No unused ports between ${start} and ${end}`)
}

export class DockerEntity extends Entity {
  @EntityField()
  containerId: string | null = null

  @EntityField()
  uniquePort: number | null = null

  @EntityField()
  name = 'Docker'

  @EntityField()
  reactCode: string = ''

  @EntityField()
  npmPackages: { [packageName: string]: string } = {}

  usedPort: number

  @EntityFunction()
  startContainer = depFn(
    {
      Docker: keyDep('Docker'),
    },
    async ({ Docker }) => {
      const docker = new Docker()
      if (!this.containerId) {
        const port = this.usedPort ?? findUnusedPort()
        this.uniquePort = port
        this.usedPort = port

        const containerInfo = await docker.createContainer({
          Image: 'node-vite',
          ExposedPorts: { '3000/tcp': {} },
          HostConfig: {
            PortBindings: { '3000/tcp': [{ HostPort: `${port}` }] },
          },
        })

        this.containerId = containerInfo.id
      }

      const container = docker.getContainer(this.containerId)
      for (const [packageName, version] of Object.entries(this.npmPackages)) {
        await this.execOnContainer({
          command: 'yarn add "' + packageName + '@' + version + '"',
          cwd: '/app',
        })
      }

      await this.updateCode({ code: this.reactCode })
      await container.start()
    }
  )

  @EntityFunction()
  execOnContainer = depFn(
    {
      PassThrough: keyDep('PassThrough'),
      tar: keyDep('tar'),
      Docker: keyDep('Docker'),
      command: keyDep('command'),
      cwd: keyDep('cwd'),
    },
    async ({ command, Docker, tar, PassThrough, cwd = '/' }) => {
      const docker = new Docker()
      const container = docker.getContainer(this.containerId)
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', ...command.split(' ')],
        WorkingDir: cwd,
        AttachStdout: true,
        AttachStderr: true,
      })

      const stream = new PassThrough()
      const options = { hijack: true, stdin: true, Tty: false }
      const response = await exec.start(options)

      container.modem.demuxStream(response, stream, stream)

      return new Promise((resolve, reject) => {
        stream.on('end', () => resolve(''))
        stream.on('data', (data) => resolve(data.toString()))
        stream.on('error', (err) => reject(err))
      })
    }
  )

  @EntityFunction()
  sendFilesToContainer = depFn(
    {
      container: keyDep('container'),
      tar: keyDep('tar'),
      files: keyDep<{
        [filePath: string]: {
          contents: string
        }
      }>('files'),
    },
    async ({ container, tar, files }) => {
      const pack = tar.pack()

      for (const [filePath, { contents }] of Object.entries(files)) {
        pack.entry({ name: filePath }, contents)
      }

      pack.finalize()

      const extractStream = container.putArchive(pack, { path: '/' })

      await new Promise((resolve, reject) => {
        extractStream.on('end', resolve)
        extractStream.on('error', reject)
      })
    }
  )

  @EntityFunction()
  stopContainer = depFn(
    {
      Docker: keyDep('Docker'),
    },
    async ({ Docker }) => {
      const docker = new Docker()
      if (this.containerId) {
        const container = docker.getContainer(this.containerId)
        await container.stop()
      }
    }
  )

  @EntityFunction()
  updateCode = depFn(
    {
      Docker: keyDep('Docker'),
      code: keyDep('code'),
    },
    async ({ Docker, code }) => {
      const docker = new Docker()
      this.reactCode = code

      if (this.containerId) {
        const container = docker.getContainer(this.containerId)
        this.sendFilesToContainer({
          container,
          files: {
            '/app/src/components/App.tsx': {
              contents: code,
            },
          },
        })
      }
    }
  )

  getUrl() {
    if (this.uniquePort) {
      return `http://localhost:${this.uniquePort}`
    }

    return null
  }
}
