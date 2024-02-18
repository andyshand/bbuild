import Docker from 'dockerode'
import { Subject } from 'rxjs'
import { Entity, EntityField } from 'modules/entities'

export class MTYKContainer extends Entity {
  @EntityField()
  dockerodeContainer: Docker.Container

  @EntityField({ defaultValue: 'idle' })
  containerState: 'idle' | 'running' | 'stopped' | 'removed' | 'error'

  async start(): Promise<void> {
    if (this.containerState === 'running') {
      throw new Error('Container is already running')
    }
    await this.dockerodeContainer.start()
    this.containerState = 'running'
  }

  async runLive(): Promise<{ output: Subject<string>; stop: () => Promise<void> }> {
    if (this.containerState === 'running') {
      throw new Error('Container is already running')
    }

    const output = new Subject<string>()
    const stream = await this.dockerodeContainer.attach({
      stream: true,
      stdout: true,
      stderr: true,
    })

    this.dockerodeContainer.modem.demuxStream(stream, process.stdout, process.stderr)

    await this.dockerodeContainer.start()
    this.containerState = 'running'

    stream.on('data', (chunk) => {
      output.next(chunk.toString())
    })
    stream.on('end', () => {
      this.containerState = 'idle'
      output.complete()
    })
    stream.on('error', (err) => {
      this.containerState = 'error'
      output.error(err)
    })

    return { output, stop: () => this.stop() }
  }

  async runAndWait(): Promise<string> {
    if (this.containerState === 'running') {
      throw new Error('Container is already running')
    }

    const live = await this.runLive()

    // return accumulated output from live.output using rxjs
    return new Promise((resolve, reject) => {
      const chunks: string[] = []
      live.output.subscribe(
        (chunk) => {
          chunks.push(chunk)
        },
        (err) => {
          reject(err)
        },
        () => {
          resolve(chunks.join(''))
        },
      )
    })
  }

  async stop(): Promise<void> {
    await this.dockerodeContainer.stop()
    this.containerState = 'stopped'
  }

  async remove(): Promise<void> {
    await this.dockerodeContainer.remove()
    this.containerState = 'removed'
  }
}
